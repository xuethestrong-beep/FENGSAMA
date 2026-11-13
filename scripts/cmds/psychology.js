const fs = require("fs-extra");
const path = require("path");

let interval=null;
module.exports={
config:{name:"psychology",version:"3.2",role:1,category:"admin",guide:"{pn} auto on/off"},
onLoad:({api})=>{
const dir=path.join(__dirname,"cache");
const p=path.join(dir,"psychology.json");
const factsPath=path.join(dir,"facts.json");
fs.ensureDirSync(dir);
if(!fs.existsSync(p))fs.writeJsonSync(p,{global:false,used:[]});
if(interval)clearInterval(interval);
interval=setInterval(async()=>{
let data=fs.readJsonSync(p);
if(!data.global)return;
if(!fs.existsSync(factsPath))return;
const facts=fs.readJsonSync(factsPath);
if(!data.used)data.used=[];
let usedCopy=[...data.used];
try{
const threads=await api.getThreadList(100,null,["INBOX"]);
for(const t of threads.filter(t=>t.isGroup)){
if(usedCopy.length>=facts.length)usedCopy=[];
let avail=facts.map((_,i)=>i).filter(i=>!usedCopy.includes(i));
let idx=avail[Math.floor(Math.random()*avail.length)];
usedCopy.push(idx);
await api.sendMessage(facts[idx],t.threadID);
await new Promise(r=>setTimeout(r,1200));
}
data.used=usedCopy;
fs.writeJsonSync(p,data);
}catch{}
},10*60*1000);
},
onStart:async({message,args})=>{
const dir=path.join(__dirname,"cache");
const p=path.join(dir,"psychology.json");
const factsPath=path.join(dir,"facts.json");
fs.ensureDirSync(dir);
if(!fs.existsSync(p))fs.writeJsonSync(p,{global:false,used:[]});
let data=fs.readJsonSync(p);
if(!fs.existsSync(factsPath))return message.reply("facts.json not found in cache folder");
const facts=fs.readJsonSync(factsPath);

if(args[0]==="auto"){
if(args[1]==="on"){data.global=true;fs.writeJsonSync(p,data);return message.reply(`✅ ON - ${facts.length} facts, different per GC`);}
if(args[1]==="off"){data.global=false;fs.writeJsonSync(p,data);return message.reply("❌ OFF");}
return message.reply(`Status: ${data.global?"ON":"OFF"} | Used: ${data.used?.length||0}/${facts.length}`);
}
if(!data.used)data.used=[];
if(data.used.length>=facts.length)data.used=[];
let avail=facts.map((_,i)=>i).filter(i=>!data.used.includes(i));
let idx=avail[Math.floor(Math.random()*avail.length)];
data.used.push(idx);fs.writeJsonSync(p,data);
return message.reply(facts[idx]);
}
};
