const fs = require("fs-extra");
module.exports = {
  config: {
    name: "antiemoji",
    version: "2.2 FIXED",
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
        return message.reply(`🚫 ANTIEMOJI KICK: ${status}\n\nOnly-emoji message = kick\nText + emoji = allowed\n\n{pn} on/off`);
      }
      settings.antiemojiKick = type === "on";
      await threadsData.set(threadID, { settings });
      return message.reply(type === "on" ? `✅ Antiemoji ON - only-emoji messages will be kicked` : `❌ Antiemoji OFF`);
    } catch (e) {
      return message.reply("❌ Failed: " + e.message);
    }
  },
  onChat: async function ({ event, message, threadsData, usersData, api }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      if (!data.settings?.antiemojiKick) return;

      const uid = String(event.senderID);
      const botID = String(api.getCurrentUserID());
      if (uid === botID) return;

      const threadInfo = await api.getThreadInfo(threadID).catch(() => null);
      const adminIDs = threadInfo?.adminIDs?.map(a => String(a.id || a)) || [];
      if (adminIDs.includes(uid)) return;

      const botAdmins = global.GoatBot?.config?.adminBot || [];
      if (botAdmins.some(a => String(a) === uid)) return;

      const msg = (event.body || "").trim();
      if (!msg) return;
      if (msg.length > 50) return; // Don't kick long emoji art

      // Only emoji check
      const withoutEmoji = msg.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}\u20E3\u{E0020}-\u{E007F}\s]/gu, "").trim();
      if (withoutEmoji.length > 0) return; // Has text = allowed

      const emojiRegex = /\p{Extended_Pictographic}/u;
      if (!emojiRegex.test(msg)) return;

      const name = await usersData.getName(uid).catch(() => "User");
      try {
        await api.removeUserFromGroup(uid, threadID);
        await message.reply(`🚫 ${name} sent only emoji → kicked\n${msg.slice(0, 20)}`);
      } catch {
        await message.reply(`⚠️ Failed to kick ${name} - bot not admin`);
      }
    } catch (e) {
      console.error("[ANTIEMOJI]", e.message);
    }
  }
};
