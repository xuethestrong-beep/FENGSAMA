const axios = require("axios");

module.exports = {
config: {
name: "waifu",
aliases: ["waifupic","animegirl","neko"],
version: "2.0-PROXY-FIX",
author: "Feng",
role: 0,
category: "anime",
guide: "{pn} | {pn} neko | {pn} hug"
},
onStart: async function({ api, event, args, message }) {
let tag = args[0]?.toLowerCase() || "waifu";
let allowed = ["waifu","neko","shinobu","megumin","bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk","yeet","blush","smile","wave","highfive","handhold","nom","bite","glomp","slap","kill","kick","happy","wink","poke","dance","cringe"];
if(!allowed.includes(tag)) tag="waifu";

const PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";

try{
let imgUrl = null;

// Try 1: waifu.pics via proxy
try{
let {data} = await axios.get(PROXY + encodeURIComponent(`https://api.waifu.pics/sfw/${tag}`), {timeout:15000});
if(data.url) imgUrl = data.url;
}catch(e){}

// Try 2: waifu.im via proxy
if(!imgUrl){
try{
let {data} = await axios.get(PROXY + encodeURIComponent(`https://api.waifu.im/search/?included_tags=${tag}`), {timeout:15000});
if(data.images?.[0]?.url) imgUrl = data.images[0].url;
}catch(e){}
}

// Try 3: Direct fallback - nekos.best
if(!imgUrl){
try{
let {data} = await axios.get(PROXY + encodeURIComponent(`https://nekos.best/api/v2/neko`), {timeout:15000});
if(data.results?.[0]?.url) imgUrl = data.results[0].url;
}catch(e){}
}

if(!imgUrl) return message.reply("❌ Waifu API down, try again.");

let img = await axios.get(PROXY + encodeURIComponent(imgUrl), {responseType:"stream", timeout:20000, headers:{"User-Agent":"Mozilla/5.0"}});

await api.sendMessage({ body: `✨ ${tag} for you!`, attachment: img.data }, event.threadID);

}catch(e){
return message.reply(`❌ Error: ${e.message}\nTry: !waifu neko`);
}
}
};
