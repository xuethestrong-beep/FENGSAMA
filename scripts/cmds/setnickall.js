module.exports = {
config: {
name: "setnickall",
aliases: ["nickall", "setallnick"],
version: "1.0",
author: "FENG",
role: 1,
description: "Set nickname to all members",
category: "box",
guide: "{pn} <nickname>\n{pn} {userName} 🚀\n{pn} clear - clear all nicknames"
},
onStart: async function({ api, event, args, message }) {
const threadID = event.threadID;

if (!args[0]) return message.reply(
`Usage:
!setnickall <nickname> - set to all
!setnickall {userName} - use their name
!setnickall clear - clear all nicks

Examples:
!setnickall 🚀 Member
!setnickall {userName} 🔥`
);

try {
const info = await api.getThreadInfo(threadID);
const members = info.participantIDs;

if (args[0].toLowerCase() === "clear" || args[0].toLowerCase() === "clearnick") {
message.reply(`⏳ Clearing ${members.length} nicknames...`);
for (const uid of members) {
try {
await api.changeNickname("", threadID, uid);
await new Promise(r=>setTimeout(r,800));
} catch(e){}
}
return message.reply(`✅ Cleared all nicknames`);
}

const template = args.join(" ");

message.reply(`⏳ Setting nickname for ${members.length} members...`);

let success = 0;
for (const uid of members) {
try {
let nick = template;
if (template.includes("{userName}")) {
const userInfo = await api.getUserInfo(uid);
const name = userInfo[uid]?.name || "User";
nick = template.replace(/\{userName\}/gi, name);
}
nick = nick.replace(/\{userID\}/gi, uid);

await api.changeNickname(nick, threadID, uid);
success++;
await new Promise(r=>setTimeout(r,800)); // avoid block
} catch(e){
console.log(e.message);
}
}
return message.reply(`✅ Done! Set ${success}/${members.length} members to: ${template}`);

} catch(e) {
return message.reply("❌ Failed: "+e.message);
}
}
};
