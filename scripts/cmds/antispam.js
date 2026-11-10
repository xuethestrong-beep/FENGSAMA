module.exports = {
  config: {
    name: "antispam",
    version: "1.1",
    author: "FENG",
    countDown: 5,
    role: 1,
    description: "Anti spam - auto warn + mute spammers",
    category: "box",
    guide: "{pn} on\n{pn} off"
  },
  onStart: async function ({ message, event, args, threadsData }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      const settings = data.settings || {};
      const type = (args[0] || "").toLowerCase();
      if (!["on", "off"].includes(type)) {
        const status = settings.antispam ? "ON ✅" : "OFF ❌";
        return message.reply(`🛡️ ANTISPAM: ${status}\n\nantispam on/off`);
      }
      settings.antispam = type === "on";
      await threadsData.set(threadID, { ...data, settings });
      return message.reply(`✅ Antispam ${type.toUpperCase()}`);
    } catch (e) {
      console.error("[ANTISPAM] Error:", e.message);
      return message.reply("❌ Failed");
    }
  },
  onChat: async function ({ event, message, threadsData, usersData }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      if (!data.settings?.antispam) return;
      const uid = String(event.senderID);
      const botID = global.GoatBot?.api?.getCurrentUserID ? String(global.GoatBot.api.getCurrentUserID()) : null;
      if (botID && uid === botID) return;
      const botAdmins = global.GoatBot?.config?.adminBot || [];
      if (botAdmins.some(a => String(a) === uid)) return;
      const groupAdmins = data.adminIDs || [];
      if (groupAdmins.some(a => String(a) === uid)) return;
      const msg = (event.body || "").trim();
      if (!msg) return;
      global.FENG_SPAM = global.FENG_SPAM || {};
      global.FENG_SPAM[threadID] = global.FENG_SPAM[threadID] || {};
      global.FENG_MUTED = global.FENG_MUTED || {};
      global.FENG_MUTED[threadID] = global.FENG_MUTED[threadID] || {};
      const now = Date.now();
      const mutedUntil = global.FENG_MUTED[threadID][uid] || 0;
      if (now < mutedUntil) return;
      if (mutedUntil && now >= mutedUntil) delete global.FENG_MUTED[threadID][uid];
      const userSpam = global.FENG_SPAM[threadID][uid] || { count: 0, lastTime: 0, lastMsg: "", warns: 0 };
      if (now - userSpam.lastTime > 10000) {
        userSpam.count = 0;
        userSpam.warns = 0;
      }
      if (msg === userSpam.lastMsg && now - userSpam.lastTime < 5000) {
        userSpam.count++;
      } else if (now - userSpam.lastTime < 2000 && msg.length > 2) {
        userSpam.count++;
      } else if (now - userSpam.lastTime >= 5000) {
        userSpam.count = 0;
      }
      userSpam.lastMsg = msg;
      userSpam.lastTime = now;
      global.FENG_SPAM[threadID][uid] = userSpam;
      for (const [id, s] of Object.entries(global.FENG_SPAM[threadID])) {
        if (now - s.lastTime > 60000) delete global.FENG_SPAM[threadID][id];
      }
      if (userSpam.count >= 5) {
        const spamCount = userSpam.count + 1;
        userSpam.count = 0;
        userSpam.warns++;
        global.FENG_SPAM[threadID][uid] = userSpam;
        const name = await usersData.getName(uid).catch(() => "User");
        if (userSpam.warns >= 2) {
          userSpam.warns = 0;
          global.FENG_SPAM[threadID][uid] = userSpam;
          global.FENG_MUTED[threadID][uid] = now + 60 * 1000;
          return message.reply(`🔇 ${name} muted for 60s for spamming! (${spamCount}x fast)`);
        }
        return message.reply(`⚠️ ${name} stop spamming! (${spamCount}x fast) - next time = 60s mute`);
      }
    } catch (e) {
      console.error("[ANTISPAM] Error:", e.message);
    }
  }
};
