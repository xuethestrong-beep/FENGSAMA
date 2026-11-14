const fs = require("fs-extra");
const path = require("path");
const filePath = path.join(__dirname, "cache", "autoreact.json");
if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
if (!fs.existsSync(filePath)) fs.writeJsonSync(filePath, {});

module.exports = {
  config: {
    name: "autoreact",
    aliases: ["ar"],
    version: "2.0",
    author: "FengSama",
    role: 1, // ADMIN ONLY
    countDown: 2,
    category: "fun"
  },
  onStart: async function ({ api, event, args, message }) {
    const data = fs.readJsonSync(filePath);
    if (args[0] === "off") {
      delete data[event.threadID];
      fs.writeJsonSync(filePath, data);
      return message.reply("✅ AutoReact 🍑 OFF");
    }
    let targetID = event.messageReply ? event.messageReply.senderID : Object.keys(event.mentions)[0];
    if (!targetID) return message.reply("Reply to message → !autoreact\n!autoreact off to stop");
    data[event.threadID] = targetID;
    fs.writeJsonSync(filePath, data);
    const info = await api.getUserInfo(targetID);
    message.reply(`✅ AutoReact ON 🍑\nNow reacting 🍑 to all messages from ${info[targetID].name}`);
  },
  onChat: async function ({ api, event }) {
    try {
      const data = fs.readJsonSync(filePath);
      const targetID = data[event.threadID];
      if (!targetID || event.senderID != targetID) return;
      api.setMessageReaction("🍑", event.messageID, () => {}, true);
    } catch {}
  }
};
