module.exports = {
config: {
name: "kick",
version: "1.4",
author: "NTKhang - fixed",
countDown: 5,
role: 1,
description: { en: "Kick member" },
category: "box chat",
guide: { en: "{pn} @tag / reply / <uid>\n{pn} all - kick all (admin only)\n{pn} list - list members" }
},
langs: {
en: { needAdmin: "❌ Bot needs to be admin", noTarget: "❌ Tag someone or reply to their message", kicked: "✅ Kicked %1 members" }
},
onStart: async function ({ message, event, args, threadsData, api, getLang }) {
const adminIDs = await threadsData.get(event.threadID, "adminIDs");
if (!adminIDs.includes(api.getCurrentUserID())) return message.reply(getLang("needAdmin"));

async function kick(uid) {
try {
await api.removeUserFromGroup(uid, event.threadID);
return true;
} catch(e) {
message.reply(getLang("needAdmin"));
return false;
}
}

// kick by UID list: !kick 123 456 789
if (args[0] && !isNaN(args[0])) {
let count=0;
for (const uid of args) {
if (await kick(uid)) count++;
await new Promise(r=>setTimeout(r,700));
}
return message.reply(getLang("kicked", count));
}

// kick by reply
if (!args[0]) {
if (!event.messageReply) return message.SyntaxError();
return await kick(event.messageReply.senderID);
}

// kick by mentions
const uids = Object.keys(event.mentions);
if (uids.length === 0) return message.SyntaxError();

let kicked = 0;
for (const uid of uids) {
if (await kick(uid)) kicked++;
await new Promise(r=>setTimeout(r,700));
}
return message.reply(getLang("kicked", kicked));
}
};
