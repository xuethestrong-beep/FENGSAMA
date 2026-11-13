const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nsfw",
    aliases: ["nsfwallow", "setnsfw"],
    version: "1.0",
    author: "Feng",
    role: 1, // only admin can toggle
    category: "admin",
    guide: "{pn} on/off | {pn} status"
  },
  onStart: async function({ api, event, args, message }) {
    const filePath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(filePath)) fs.writeJsonSync(filePath, {});

    let data = fs.readJsonSync(filePath);
    let threadID = event.threadID;
    let input = (args[0] || "").toLowerCase();

    if (!input || input === "status" || input === "check") {
      let status = data[threadID] ? "ON ✅" : "OFF ❌";
      return message.reply(`🔞 NSFW Status for this group: ${status}\n\nUse:\n!nsfw on - enable\n!nsfw off - disable`);
    }

    if (input === "on" || input === "enable") {
      data[threadID] = true;
      fs.writeJsonSync(filePath, data, { spaces: 2 });
      return message.reply("✅ NSFW ENABLED for this group\nNow you can use:\n!doujin 123456\n!doujin random");
    }

    if (input === "off" || input === "disable") {
      delete data[threadID];
      fs.writeJsonSync(filePath, data, { spaces: 2 });
      return message.reply("❌ NSFW DISABLED for this group");
    }

    return message.reply("Use: !nsfw on/off");
  }
};
