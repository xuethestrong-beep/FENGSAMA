const fs = require("fs-extra");
const path = require("path");

const filePath = path.join(__dirname, "cache", "autoclone.json");

if (!fs.existsSync(path.join(__dirname, "cache"))) {
  fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
}
if (!fs.existsSync(filePath)) {
  fs.writeJsonSync(filePath, {});
}

module.exports = {
  config: {
    name: "autoclone",
    aliases: ["ac"],
    version: "1.2",
    author: "FengSama (fixed)",
    role: 1,
    countDown: 2,
    category: "fun",
    guide: {
      en: "{pn} @mention or reply\n{pn} off"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const data = fs.readJsonSync(filePath);

    if (args[0]?.toLowerCase() === "off") {
      delete data[event.threadID];
      fs.writeJsonSync(filePath, data);
      return message.reply("✅ AutoClone OFF");
    }

    let targetID = event.messageReply ? event.messageReply.senderID : Object.keys(event.mentions)[0];
    if (!targetID) return message.reply("Reply to someone: !autoclone\n!autoclone off to stop");

    if (targetID == api.getCurrentUserID()) return message.reply("❌ Can't clone myself");

    data[event.threadID] = targetID;
    fs.writeJsonSync(filePath, data);

    const info = await api.getUserInfo(targetID);
    return message.reply(`✅ AutoClone ON: ${info[targetID]?.name || targetID}`);
  },

  onChat: async function ({ api, event }) {
    try {
      const data = fs.readJsonSync(filePath);
      const targetID = data[event.threadID];
      if (!targetID || event.senderID != targetID) return;
      if (event.senderID == api.getCurrentUserID()) return;
      if (event.body && (event.body.toLowerCase().startsWith("!autoclone") || event.body.toLowerCase().startsWith("!ac"))) return;

      // If has attachment, clone it
      if (event.attachments && event.attachments.length > 0) {
        const msg = {
          body: event.body || "",
          attachment: event.attachments
        };
        return api.sendMessage(msg, event.threadID);
      }

      // If only text
      if (event.body) {
        return api.sendMessage(event.body, event.threadID);
      }

      // If sticker
      if (event.sticker) {
        return api.sendMessage({ sticker: event.sticker }, event.threadID);
      }

    } catch (e) {}
  }
};
