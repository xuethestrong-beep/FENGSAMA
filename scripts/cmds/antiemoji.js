module.exports = {
  config: {
    name: "antiemoji",
    version: "2.1",
    author: "FENG",
    countDown: 3,
    role: 1,
    description: "Anti emoji - kick who sends only emoji",
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
        const status = settings.antiemojiKick ? "ON ✅" : "OFF ❌";
        return message.reply(`🚫 ANTIEMOJI KICK: ${status}\n\nOnly-emoji message = kick\nText + emoji = allowed\n\nantiemoji on/off`);
      }
      settings.antiemojiKick = type === "on";
      await threadsData.set(threadID, { ...data, settings });
      return message.reply(type === "on" ? `✅ Antiemoji ON - only-emoji messages will be kicked` : `❌ Antiemoji OFF`);
    } catch (e) {
      return message.reply("❌ Failed");
    }
  },
  onChat: async function ({ event, message, threadsData, usersData, api }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      if (!data.settings?.antiemojiKick) return;
      const uid = String(event.senderID);
      const botID = api?.getCurrentUserID ? String(api.getCurrentUserID()) : String(global.GoatBot?.api?.getCurrentUserID?.() || "");
      if (uid === botID) return;
      const botAdmins = global.GoatBot?.config?.adminBot || [];
      if (botAdmins.some(a => String(a) === uid)) return;
      const adminIDs = data.adminIDs || [];
      if (adminIDs.some(a => String(a) === uid)) return;
      const msg = event.body || "";
      if (!msg.trim()) return;
      const emojiRegex = /\p{Extended_Pictographic}/u;
      if (!emojiRegex.test(msg)) return;
      const withoutEmoji = msg.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}\u20E3\u{E0020}-\u{E007F}]/gu, "").trim();
      if (withoutEmoji.length > 0) return;
      const name = await usersData.getName(uid).catch(() => "User");
      try {
        await api.removeUserFromGroup(uid, threadID);
        await message.reply(`🚫 ${name} sent only emoji - kicked for antiemoji! ${msg.slice(0, 20)}`);
      } catch (err) {
        await message.reply(`⚠️ Failed to kick ${name} - bot may not be admin`);
      }
    } catch (e) {
      console.error("[ANTIEMOJI] Error:", e.message);
    }
  }
};
