module.exports = {
config: {
name: "friendreq",
aliases: ["fr"],
version: "1.0",
role: 2,
category: "owner",
guide: "{pn}\n{pn} confirm <num>\n{pn} confirm all"
},
onStart: async function({ api, event, args, message }){
try{
const reqs = await new Promise((r,j)=>api.getFriendRequests((e,d)=>e?j(e):r(d)));
if(!reqs || !reqs.length) return message.reply("✅ No pending requests");

if(args[0]=="confirm"){
if(args[1]=="all"){
let ok=0;
for(const u of reqs){
try{await new Promise((r,j)=>api.confirmFriendRequest(u.userID,(e,d)=>e?j(e):r(d))); ok++; await new Promise(x=>setTimeout(x,1000));}catch{}
}
return message.reply(`✅ Confirmed ${ok}/${reqs.length}`);
}
const n=parseInt(args[1]);
if(!isNaN(n) && reqs[n-1]){
await new Promise((r,j)=>api.confirmFriendRequest(reqs[n-1].userID,(e,d)=>e?j(e):r(d)));
return message.reply(`✅ Confirmed ${reqs[n-1].name}`);
}
}

let txt=`📨 Requests (${reqs.length})\n\n`;
reqs.slice(0,15).forEach((u,i)=>txt+=`${i+1}. ${u.name}\n`);
txt+=`\nReply number to confirm\n!friendreq confirm all`;
return message.reply(txt,(err,info)=>{
if(!err) global.GoatBot.onReply.set(info.messageID,{commandName:"friendreq",author:event.senderID,reqs});
});
}catch(e){return message.reply("❌ Error: "+e.message);}
},
onReply: async function({ event, Reply, api, message }){
if(event.senderID!=Reply.author) return;
const n=parseInt(event.body);
if(isNaN(n)) return;
const u=Reply.reqs[n-1];
if(!u) return message.reply("❌ Invalid");
try{
await new Promise((r,j)=>api.confirmFriendRequest(u.userID,(e,d)=>e?j(e):r(d)));
message.reply(`✅ ${u.name} confirmed!`);
}catch(e){message.reply("❌ "+e.message);}
}
};
