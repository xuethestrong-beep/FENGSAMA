const axios = require("axios");

module.exports = {
config: { name: "shoti", aliases: ["shotii","tiktokgirl"], version: "1.0", author: "Feng", role: 0, category: "fun", guide: "{pn}" },
onStart: async function({ api, event, message }) {
try{
await message.reply("🎬 Sending shoti... ⏳");
let apis = [
"https://shoti.fbbot.org/api/get-shoti?apikey=$@FBBOT@@",
"https://shoti.kenliejugarap.com/api/v1/request/f?apikey=kenlie-apikey",
"https://api.kenliejugarap.com/shoti/"
];
let data = null;
for(let apiUrl of apis){
try{
let res = await axios.get(apiUrl, {timeout:10000});
if(res.data.data) { data = res.data.data; break; }
if(res.data.result) { data = res.data.result; break; }
if(res.data.shoti) { data = res.data; break; }
}catch(e){ continue; }
}
if(!data) return message.reply("❌ Shoti API down, try again later.");

let videoUrl = data.shoti || data.url || data.link || data.videoUrl;
let username = data.username || data.user || data.title || "Shoti";
let vid = await axios.get(videoUrl, {responseType:"stream", timeout:30000});
await api.sendMessage({ body: `💃 @${username}\n\n!shoti again for next`, attachment: vid.data }, event.threadID);
}catch(e){ return message.reply(`❌ Error: ${e.message}`); }
}
};
