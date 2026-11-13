const fs = require("fs-extra");
const path = require("path");
module.exports = {
config: {
name: "antireact",
version: "1.1",
role: 1,
category: "admin",
guide: "{pn} on/off - kick anyone who reacts"
},
onStart: async function({ args, event, message }) {
const p = path.join(__dirname, "cache", "antireact.json");
fs.ensureDirSync(path.join(__dirname, "cache"));
if (!fs.existsSync(p)) fs.writeJsonSync(p, {});
let d = fs.readJsonSync(p);
if (!d[event.threadID]) d[event.threadID] = false;

if (args[0] === "on") {
d[event.threadID] = true;
fs.writeJsonSync(p, d);
return message.reply("✅ Anti-react ON - ");
}
if (args[0] === "off") {
d[event.threadID] = false;
fs.writeJsonSync(p, d);
return message.reply("❌ Anti-react OFF");
}
return message.reply(`Status: ${d[event.threadID] ? "ON" : "OFF"}\nUse ${this.config.name} on/off`);
},
onChat: async function({ api, event }) {
// Handle reaction event
if (event.type === "message_reaction") {
const p = path.join(__dirname, "cache", "antireact.json");
if (!fs.existsSync(p)) return;
let d = fs.readJsonSync(p);
if (!d[event.threadID]) return;

let uid = event.userID;
if (!uid || uid == api.getCurrentUserID()) return;

// Don't kick admins
try {
let info = await api.getThreadInfo(event.threadID);
if (info.adminIDs.some(a => a.id == uid)) return;
} catch {}

try {
await api.removeUserFromGroup(uid, event.threadID);
api.sendMessage(`🚫 Kicked ${uid} for reacting`, event.threadID);
} catch {}
}
}
};
