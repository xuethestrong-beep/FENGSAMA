module.exports = {
config: { name: "remotegc", aliases: ["rgc"], version: "3.0", role: 2, category: "owner", guide: "{pn} list | {pn} <id> <command>" },
onStart: async function({ api, args, event, message }) {
if (args[0] === "list") {
const list = await api.getThreadList(50, null, ["INBOX"]);
let msg = `📋 GCs (${list.length})\n\n`;
list.filter(t=>t.isGroup).slice(0,20).forEach((t,i)=>{ msg+=`${i+1}. ${t.name}\nID: ${t.threadID}\n\n`; });
return message.reply(msg);
}
if (!args[0] || !args[1]) {
return message.reply(
`📚 REMOTE GC:

!rgc list
!rgc <id> say <msg>
!rgc <id> nick <uid> <name>
!rgc <id> setnickall <nickname> - set nick to all in other GC
!rgc <id> clearnick - clear all nicks in other GC
!rgc <id> kick <uid>
!rgc <id> add <uid>
!rgc <id> antispam on/off
!rgc <id> any command`
);
}
const targetID = args[0];
const action = args[1].toLowerCase();
const extra = args.slice(2).join(" ");
try {
const info = await api.getThreadInfo(targetID);

if (action === "say") {
await api.sendMessage(extra, targetID);
return message.reply(`✅ Sent to ${info.threadName}`);
}

if (action === "nick") {
const uid = args[2]; const newNick = args.slice(3).join(" ");
await api.changeNickname(newNick, targetID, uid);
return message.reply(`✅ Changed nick in ${info.threadName}`);
}

if (action === "setnickall") {
if (!extra) return message.reply("❌ Usage: !rgc <id> setnickall <nickname>");
const members = info.participantIDs;
message.reply(`⏳ Setting ${members.length} nicks in ${info.threadName}...`);
let success=0;
for (const uid of members) {
try {
let nick = extra;
if (extra.includes("{userName}")) {
const u = await api.getUserInfo(uid);
nick = extra.replace(/\{userName\}/gi, u[uid]?.name || "User");
}
await api.changeNickname(nick, targetID, uid);
success++;
await new Promise(r=>setTimeout(r,800));
}catch(e){}
}
return message.reply(`✅ Set ${success}/${members.length} in ${info.threadName} to: ${extra}`);
}

if (action === "clearnick" || action === "clearnickall" || action === "clearallnick") {
const members = info.participantIDs;
message.reply(`⏳ Clearing ${members.length} nicks in ${info.threadName}...`);
for (const uid of members) {
try {
await api.changeNickname("", targetID, uid);
await new Promise(r=>setTimeout(r,800));
}catch(e){}
}
return message.reply(`✅ Cleared all nicks in ${info.threadName}`);
}

if (action === "kick") { await api.removeUserFromGroup(args[2], targetID); return message.reply(`✅ Kicked from ${info.threadName}`); }
if (action === "add") { await api.addUserToGroup(args[2], targetID); return message.reply(`✅ Added to ${info.threadName}`); }

// Any bot command
const cmdName = args[1]; const cmdArgs = args.slice(2);
const command = global.GoatBot.commands.get(cmdName) || global.GoatBot.commands.get(global.GoatBot.aliases.get(cmdName));
if (command?.onStart) {
await command.onStart({ api, event: { threadID: targetID, senderID: event.senderID }, args: cmdArgs, message: { reply: (txt)=>{ api.sendMessage(txt, targetID); message.reply(`✅ Done in ${info.threadName}:\n${txt}`); } }, threadsData: global.GoatBot.threadsData, usersData: global.GoatBot.usersData });
return;
}
return message.reply("❌ Unknown action");
} catch(e) { return message.reply("❌ Failed: "+e.message); }
}
};
