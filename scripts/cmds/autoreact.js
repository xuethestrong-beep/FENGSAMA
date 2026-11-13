const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autoreact",
    version: "5.0",
    author: "fixed by Moonlight",
    countDown: 0,
    role: 1,
    shortDescription: "auto react with on/off",
    longDescription: "auto react - can turn on/off and change emoji",
    category: "auto",
  },

  onStart: async function ({ message, args, event }) {
    const p = path.join(__dirname, "cache", "autoreact.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(p)) fs.writeJsonSync(p, { enabled: true, emoji: "🐷" });
    let d = fs.readJsonSync(p);

    if (!args[0]) {
      return message.reply(
        `Autoreact: ${d.enabled ? "ON" : "OFF"}\nEmoji: ${d.emoji}\n\n!autoreact on/off\n!autoreact set 😆\n!autoreact 😆`
      );
    }

    if (args[0] === "on") {
      d.enabled = true;
      fs.writeJsonSync(p, d);
      return message.reply(`✅ Autoreact ON | ${d.emoji}`);
    }
    if (args[0] === "off") {
      d.enabled = false;
      fs.writeJsonSync(p, d);
      return message.reply("✅ Autoreact OFF");
    }
    if (args[0] === "set" && args[1]) {
      d.emoji = args[1];
      fs.writeJsonSync(p, d);
      return message.reply(`✅ Emoji changed to ${d.emoji}`);
    }
    // if directly emoji like !autoreact 😆
    if (args[0].length <= 4) {
      d.emoji = args[0];
      fs.writeJsonSync(p, d);
      return message.reply(`✅ Emoji changed to ${d.emoji}`);
    }
  },

  onChat: async function ({ event, api }) {
    const p = path.join(__dirname, "cache", "autoreact.json");
    if (!fs.existsSync(p)) return;
    let d = fs.readJsonSync(p);
    if (!d.enabled) return;

    const botID = api.getCurrentUserID();
    if (event.senderID == botID) return;
    
    // don't react to bot commands
    if (event.body && event.body.startsWith("!")) return;

    try {
      api.setMessageReaction(d.emoji || "🐷", event.messageID, () => {}, true);
    } catch (e) {}
  }
};
