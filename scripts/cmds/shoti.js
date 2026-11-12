const axios = require("axios");

module.exports = {
config: {
name: "shoti",
aliases: ["shotii","tiktokgirl","girl"],
version: "2.0-MULTI-API",
author: "Feng",
role: 0,
category: "fun",
guide: "{pn}"
},
onStart: async function({ api, event, message }) {
const PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";
let tmpMsg = null;

try{
let sent = await api.sendMessage("🎬 Sending shoti... ⏳", event.threadID);
tmpMsg = sent.messageID;

let apis = [
"https://api.kenliejugarap.com/shoti/",
"https://shoti.fbbot.org/api/get-shoti?apikey=$@FBBOT@@",
"https://shoti.kenliejugarap.com/api/v1/request/f?apikey=kenlie-apikey",
"https://api-v2.kenliejugarap.com/shoti",
"https://shoti-api.kenliejugarap.com/api/v1/shoti"
];

let data = null;
let videoUrl = null;
let username = "Shoti";

for(let apiUrl of apis){
try{
let urlToTry = apiUrl;
let res = await axios.get(urlToTry, {timeout: 15000, headers: {"User-Agent":"Mozilla/5.0"}});
let d = res.data;
// Parse all formats
if(d.data) d = d.data;
if(d.result) d = d.result;
if(d.shoti) d = d.shoti;
if(typeof d === "object"){
videoUrl = d.shoti || d.url || d.link || d.videoUrl || d.video || d.downloadUrl;
username = d.username || d.user || d.author || d.title || "Shoti";
if(videoUrl) { data = d; break; }
}
}catch(e){ continue; }

// Try via proxy if direct fails
try{
let res2 = await axios.get(PROXY + encodeURIComponent(apiUrl), {timeout: 15000});
let d = res2.data;
if(d.data) d = d.data;
if(d.result) d = d.result;
videoUrl = d.shoti || d.url || d.link || d.videoUrl || d.video;
username = d.username || d.user || "Shoti";
if(videoUrl) break;
}catch(e){ continue; }
}

if(tmpMsg) api.unsendMessage(tmpMsg);

if(!videoUrl) return message.reply("❌ All Shoti APIs down right now. Try again in 5 mins.\nTry !waifu or !manga muna.");

let vid = await axios.get(videoUrl, {responseType:"stream", timeout:30000, headers:{"User-Agent":"Mozilla/5.0", "Referer":"https://www.tiktok.com/"}});
await api.sendMessage({ body: `💃 @${username}\n\nType !shoti again for next`, attachment: vid.data }, event.threadID);

}catch(e){
if(tmpMsg) api.unsendMessage(tmpMsg);
return message.reply(`❌ Error: ${e.message}\nTry again: !shoti`);
}
}
};
