const axios = require("axios");
module.exports = {
config: { name: "shoti", version: "3.0-FIXED", author: "Feng", role: 0, category: "FUN", guide: "{pn}" },
onStart: async function({ api, event, message }) {
try{
await message.reply("🎬 Loading shoti...");
let apis = [
"https://shoti-api.libyzxy0.workers.dev/api/get-shoti",
"https://shoti.fbbot.org/api/get-shoti",
"https://shoti-api2.vercel.app/api/shoti",
"https://shoti-api-5kgg.onrender.com/api/get-shoti"
];
let data = null;
for(let url of apis){
try{
let res = await axios.get(url, {timeout:10000});
let d = res.data?.data || res.data;
if(d && d.url){ data = d; break; }
}catch(e){}
}
if(!data) return message.reply("❌ All shoti APIs sleeping, try again after 5 mins");
let vid = await axios.get(data.url, {responseType:"stream", timeout:20000});
await api.sendMessage({body:`😍 @${data.username || data.user?.username || "shoti"}`, attachment: vid.data}, event.threadID);
}catch(e){ message.reply("❌ Shoti error: "+e.message); }
}
};
