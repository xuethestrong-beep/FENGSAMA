module.exports = {
config: { name: "noti", version: "1.0", author: "Feng", role: 2, category: "owner", guide: "{pn} <message>" },
onStart: async function({ api, args, message }) {
const msg = args.join(" ");
if (!msg) return message.reply("❌ Enter message: !noti Hello all GCs");
const list = await api.getThreadList(100, null, ["INBOX"]);
const groups = list.filter(t=>t.isGroup);
message.reply(`⏳ Sending to ${groups.length} groups...`);
let success=0;
for (const g of groups) {
try {
await api.sendMessage(`📢 NOTIFICATION FROM ADMIN:\n\n${msg}`, g.threadID);
success++;
await new Promise(r=>setTimeout(r,1200));
} catch(e){}
}
return message.reply(`✅ Sent to ${success}/${groups.length} groups`);
}
};
