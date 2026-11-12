const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytdl = require("@distube/ytdl-core");

module.exports = {
config: {
name: "music",
aliases: ["play","song","yt"],
version: "3.0-CLEAN-DELETE",
author: "Feng",
role: 0,
category: "music",
guide: "{pn} take all the love"
},
onStart: async function({ api, event, args, message }) {
let query = args.join(" ");
if(!query) return message.reply("Usage: !music take all the love");

let tmpMsg = null;
let filePath = "";

try{
// 1. Send 1 searching msg and SAVE its ID to delete later
let sent = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
tmpMsg = sent.messageID;

let search = await yts(query);
if(!search.videos.length) {
if(tmpMsg) api.unsendMessage(tmpMsg);
return api.sendMessage("❌ No results", event.threadID);
}
let video = search.videos[0];
let url = `https://www.youtube.com/watch?v=${video.videoId}`;
filePath = path.join(__dirname, `../../tmp/${Date.now()}.mp3`);

// 2. Download using your Railway cookie
let cookie = process.env.YT_COOKIE || process.env.COOKIE || process.env.YOUTUBE_COOKIE || "";
if(!cookie) {
if(tmpMsg) api.unsendMessage(tmpMsg);
return api.sendMessage("❌ No YT_COOKIE found in Railway Variables", event.threadID);
}

let agent = ytdl.createAgent(JSON.parse(cookie.startsWith("[") ? cookie : `[{"name":"__Secure-3PSID","value":"${cookie}","domain":".youtube.com"}]`).length ? cookie : `[]`), cookie.includes("netscape") ? undefined : undefined);

// Simple cookie header method - works best
const stream = ytdl(url, {
filter: "audioonly",
quality: "highestaudio",
highWaterMark: 1 << 25,
requestOptions: { headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" } }
});

let writeStream = fs.createWriteStream(filePath);
stream.pipe(writeStream);

await new Promise((res, rej) => {
writeStream.on("finish", res);
writeStream.on("error", rej);
stream.on("error", rej);
});

// 3. Send song
await api.sendMessage({
body: `🎧 ${video.title}\n⏱️ ${video.timestamp}`,
attachment: fs.createReadStream(filePath)
}, event.threadID, () => {
if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

// 4. DELETE the "Searching..." message = clean!
if(tmpMsg) {
setTimeout(() => api.unsendMessage(tmpMsg), 1000);
}

}catch(e){
// If ytdl-core fails, try backup API
try{
let backupUrl = `https://api.ryzendesu.vip/api/downloader/ytmp3?url=https://www.youtube.com/watch?v=${(await yts(query)).videos[0].videoId}`;
let {data} = await axios.get(backupUrl, {timeout:20000});
let audioUrl = data.result || data.url || data.downloadUrl;
if(audioUrl){
let audioStream = await axios.get(audioUrl, {responseType:"stream", timeout:30000});
let writer = fs.createWriteStream(filePath);
audioStream.data.pipe(writer);
await new Promise(r=>writer.on("finish",r));
await api.sendMessage({ body: `🎧 ${query}`, attachment: fs.createReadStream(filePath)}, event.threadID, ()=>{
if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
if(tmpMsg) api.unsendMessage(tmpMsg);
});
return;
}
}catch(err2){}
if(tmpMsg) api.unsendMessage(tmpMsg);
return api.sendMessage(`❌ Download failed: ${e.message}\nYour YT_COOKIE might be expired. Re-copy from YouTube > F12 > Application > Cookies > Copy __Secure-3PSID`, event.threadID);
}
}
};
