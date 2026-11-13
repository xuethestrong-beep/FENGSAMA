const fs = require("fs-extra");
const path = require("path");

module.exports = {
config: {
  name: "gcmsg",
  aliases: ["sendgc","saygc","msggc"],
  version: "1.0",
  role: 2, // only you/admin
  category: "admin",
  guide: "{pn} - list GCs\n{pn} <id/number> <message>"
},

onChat: ({event})=>{
  if(!event.isGroup) return;
  const p = path.join(__dirname,"cache","gcmsg.json");
  fs.ensureDirSync(path.join(__dirname,"cache"));
  if(!fs.existsSync(p)) fs.writeJsonSync(p,{threads:{}});
  let d = fs.readJsonSync(p);
  d.threads[event.threadID] = event.threadName || `GC ${event.threadID.slice(0,6)}`;
  fs.writeJsonSync(p,d);
},

onStart: async ({api, message, args, event})=>{
  const p = path.join(__dirname,"cache","gcmsg.json");
  fs.ensureDirSync(path.join(__dirname,"cache"));
  if(!fs.existsSync(p)) fs.writeJsonSync(p,{threads:{}});
  let d = fs.readJsonSync(p);
  
  // save current gc too
  if(event.isGroup){
    d.threads[event.threadID] = event.threadName || `GC ${event.threadID.slice(0,6)}`;
    fs.writeJsonSync(p,d);
  }

  const threadList = Object.entries(d.threads);

  if(!args[0]){
    if(threadList.length==0) return message.reply("No GC saved yet. Bot needs to chat in GCs first.");
    let msg = "📋 GC List (use number):\n\n";
    threadList.forEach(([id,name],i)=>{
      const isHere = id==event.threadID ? " [HERE]" : "";
      msg+=`${i+1}. ${name}${isHere}\nID: ${id}\n\n`;
    });
    msg+="\nUsage: gcmsg 1 Hello everyone in that gc";
    return message.reply(msg);
  }

  // get target
  let targetId = args[0];
  let num = parseInt(targetId);
  if(!isNaN(num) && num>=1 && num<=threadList.length){
    targetId = threadList[num-1][0];
  }

  if(!d.threads[targetId]) return message.reply("Invalid GC number/ID. Do gcmsg to see list.");

  const text = args.slice(1).join(" ");
  if(!text) return message.reply("What message? Example: gcmsg 1 hello from Moonlight");

  try{
    await api.sendMessage(text, targetId);
    return message.reply(`✅ Sent to ${d.threads[targetId]}:\n"${text}"`);
  }catch(e){
    return message.reply(`Failed: ${e.message}`);
  }
}
};
