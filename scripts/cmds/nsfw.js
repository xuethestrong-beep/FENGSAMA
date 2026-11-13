const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nsfw",
    version: "2.1",
    author: "Feng",
    role: 1,
    category: "admin",
    guide: "{pn} on/off"
  },
  onStart: async function({ api, event, args, message }) {
    const dir = path.join(__dirname, "cache");
    const nsfwPath = path.join(dir, "nsfw.json");
    const adultPath = path.join(dir, "adult.json");
    fs.ensureDirSync(dir);
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.existsSync(adultPath)) fs.writeJsonSync(adultPath, {});

    let nsfw = fs.readJsonSync(nsfwPath);
    let adult = fs.readJsonSync(adultPath);
    let tid = event.threadID;
    let cmd = (args[0] || "").toLowerCase();

    // self verify
    if (cmd === "iam18" || cmd === "verify") {
      if (!adult[tid]) adult[tid] = [];
      if (adult[tid].includes(event.senderID)) 
        return message.reply("Already verified ✓");
      adult[tid].push(event.senderID);
      fs.writeJsonSync(adultPath, adult);
      return message.reply("✓ Verified 18+");
    }

    if (cmd === "list") {
      let count = (adult[tid] || []).length;
      return message.reply(`Verified: ${count} users`);
    }

    if (!cmd || cmd === "status") {
      let on = nsfw[tid] ? "ON" : "OFF";
      return message.reply(`NSFW: ${on}\n!nsfw on | off\n!nsfw iam18 - to verify`);
    }

    if (cmd === "on") {
      nsfw[tid] = true;
      fs.writeJsonSync(nsfwPath, nsfw);
      return message.reply("NSFW enabled");
    }

    if (cmd === "off") {
      delete nsfw[tid];
      fs.writeJsonSync(nsfwPath, nsfw);
      return message.reply("NSFW disabled");
    }
  }
};
