const axios = require("axios");

module.exports = {
config: { name: "waifu", aliases: ["waifupic","animegirl"], version: "1.0", author: "Feng", role: 0, category: "anime", guide: "{pn} | {pn} neko | {pn} waifu" },
onStart: async function({ api, event, args, message }) {
let tag = args[0] || "waifu";
let allowed = ["waifu","neko","shinobu","megumin","bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk","yeet","blush","smile","wave","highfive","handhold","nom","bite","glomp","slap","kill","kick","happy","wink","poke","dance","cringe"];
if(!allowed.includes(tag)) tag="waifu";
try{
let {data} = await axios.get(`https://api.waifu.pics/sfw/${tag}`, {timeout:10000});
let imgUrl = data.url;
let img = await axios.get(imgUrl, {responseType:"stream", timeout:15000});
await api.sendMessage({ body: `✨ ${tag} for you!`, attachment: img.data }, event.threadID);
}catch(e){ return message.reply(`❌ Error waifu: ${e.message}`); }
}
};
