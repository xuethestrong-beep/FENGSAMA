const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
config: { name: "music", aliases: ["play","song","yt","musicv2"], version: "2.0-COOKIE", author: "Feng", role: 0, category: "music", guide: "{pn} die with a smile | {pn} naruto op" },
onStart: async function({ api, event, args, message }) {
let query = args.join(" ");
if(!query) return message.reply("Usage: !music die with a smile\n!play naruto opening");

try{
await message.reply(`🔍 Searching: ${query}...`);
let search = await yts(query);
if(!search.videos.length) return message.reply("❌ No results found");
let video = search.videos[0];
let videoId = video.videoId;
let title = video.title;
let duration = video.timestamp;

await message.reply(`🎵 Found: ${title}\n⏱️ ${duration}\n⬇️ Downloading with your cookie...`);

// Use your cookie from Railway ENV
let cookie = process.env.YT_COOKIE || process.env.COOKIE || process.env.YOUTUBE_COOKIE || "";

let apiUrl = `https://ytdl.kenliejugarap.com/api/v1/ytdl?url=https://www.youtube.com/watch?v=${videoId}&format=mp3&cookie=${encodeURIComponent(cookie)}`;

// Fallback APIs that work with cookie
let apis = [
`https://api.ferdev.my.id/downloader/ytmp3?link=https://www.youtube.com/watch?v=${videoId}`,
`https://api.ryzendesu.vip/api/downloader/ytmp3?url=https://www.youtube.com/watch?v=${videoId}`,
`https://yt-api.akuari.my.id/downloader/ytmp3?link=https://www.youtube.com/watch?v=${videoId}`
];

let audioUrl = null;
for(let url of apis){
try{
let {data} = await axios.get(url, {timeout:20000});
audioUrl = data.result || data.download || data.url || data.link || data.data?.url;
if(audioUrl) break;
}catch(e){ continue; }
}

if(!audioUrl) return message.reply(`❌ Download failed. Your cookie might be expired.\nCheck Railway Variables > YT_COOKIE\n\nTitle: ${title}\nLink: https://www.youtube.com/watch?v=${videoId}`);

let audioStream = await axios.get(audioUrl, {responseType:"stream", timeout:30000});
let filePath = path.join(__dirname, `../../tmp/${Date.now()}.mp3`);

// Save then send to avoid memory
let writer = fs.createWriteStream(filePath);
audioStream.data.pipe(writer);
await new Promise((res, rej)=> { writer.on("finish", res); writer.on("error", rej); });

await api.sendMessage({
body: `🎧 ${title}\n⏱️ ${duration}\n\nRequested by: ${event.senderID}`,
attachment: fs.createReadStream(filePath)
}, event.threadID, ()=> fs.unlinkSync(filePath));

}catch(e){
return message.reply(`❌ Music error: ${e.message}\nMake sure you have yt-search installed: npm install yt-search`);
}
}
};
