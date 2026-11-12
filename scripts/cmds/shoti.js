const axios = require("axios");
module.exports = {
config: { name: "shoti", aliases: ["shotii","girl","tiktokgirl"], version: "6.0-NEW-2026", author: "Feng", role: 0, category: "FUN", guide: "{pn}" },
onStart: async function({ api, event, message }) {
try{
let loading = await message.reply("🎬 Loading shoti...");

let apis = [
"https://shoti-api-5m4n.onrender.com/api/get-shoti",
"https://shoti.kenliejugarap.com/api/shoti",
"https://api.kenliejugarap.com/shoti",
"https://shoti-api.vercel.app/api/shoti",
"https://shoti-api.adaptable.app/api/get-shoti",
"https://shoti-api.calyxsi.workers.dev/api/get-shoti",
"https://shoti-api.joshua-resto.workers.dev/api/get-shoti",
"https://shoti.bhandarimilan.info.np/api/shoti"
];

let data = null;
let lastErr = "";

for(let url of apis){
try{
console.log(`Trying ${url}`);
let res = await axios.get(url, {timeout:12000, headers:{"User-Agent":"Mozilla/5.0"}});
let d = res.data?.data || res.data?.result || res.data;
if(d && (d.url || d.shoti || d.link)){
data = d;
console.log(`Success ${url}`);
break;
}
}catch(e){ lastErr = e.message; }
}

if(!data){
return message.reply(`❌ All shoti APIs sleeping\nLast error: ${lastErr}\nTry again in 2 mins - APIs restart`);
}

let videoUrl = data.url || data.shoti || data.link || data.video || data.tiktokUrl;
let username = data.username || data.user?.username || data.author || data.name || "shoti";
let title = data.title || data.caption || "";

if(!videoUrl) return message.reply("❌ No video URL from API");

let vid = await axios.get(videoUrl, {responseType:"stream", timeout:30000, headers:{"User-Agent":"Mozilla/5.0"}});
await api.sendMessage({
body: `😍 @${username}\n${title}`,
attachment: vid.data
}, event.threadID, ()=> {
try{ api.unsendMessage(loading.messageID); }catch{}
});

}catch(e){
return message.reply(`❌ Shoti error: ${e.message}\nAPI down, try !shoti again`);
}
}
};
