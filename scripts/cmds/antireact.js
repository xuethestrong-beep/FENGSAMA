const fs = require("fs-extra");
const path = require("path");
module.exports = {
  config: { name: "antireact", version: "1.0", role: 1, category: "admin", guide: "{pn} on/off" },
  onStart: async function({ api, event, args, message }) {
    const p = path.join(__dirname, "cache", "antireact.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(p)) fs.writeJsonSync(p, {});
    let d = fs.readJsonSync(p);
    if (!d[event.threadID]) d[event.threadID] = false;
    let cmd = (args[0] || "").toLowerCase();
    if (cmd === "on") { d[event.threadID] = true; fs.writeJsonSync(p, d); return message.reply("on"); }
    if (cmd === "off") { d[event.threadID] = false; fs.writeJsonSync(p, d); return message.reply("off"); }
    return message.reply(d[event.threadID] ? "on" : "off");
  },
  onChat: async function({ api, event }) {
    const p = path.join(__dirname, "cache", "antireact.json");
    if (!fs.existsSync(p)) return;
    let d = fs.readJsonSync(p);
    if (!d[event.threadID]) return;
    let uid = event.userID || event.senderID;
    if (!uid || uid === api.getCurrentUserID()) return;
    try { let i = await api.getThreadInfo(event.threadID); if (i.adminIDs.map(a => a.id).includes(uid)) return; } catch {}
    if (event.type === "message_reaction") {
      try { await api.removeUserFromGroup(uid, event.threadID); } catch {}
      return;
    }
    if (event.type === "message" && event.body) {
      let t = event.body.trim();
      if (/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u.test(t) && t.replace(/\s/g, "").length <= 5) {
        try { await api.removeUserFromGroup(uid, event.threadID); } catch {}
      }
    }
  }
};
