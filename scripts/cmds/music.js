// Use your cookie code but fixed
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytdl = require("@distube/ytdl-core");

module.exports = {
config: { name: "music", version: "3.1-YT-COOKIE-FIXED", author: "Feng", role: 0, category: "music" },
onStart: async function({ api, event, args, message }){
let query = args.join(" ");
if(!query) return message.reply("Usage: !music <song>");

let filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
fs.ensureDirSync(path.join(__dirname, "cache"));
let tmpMsg = null;

try{
let sent = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
tmpMsg = sent.messageID;

let search = await yts(query);
let video = search.videos[0];
let url = `https://www.youtube.com/watch?v=${video.videoId}`;

// FIX: Read cookie correctly
let cookie = process.env.YT_COOKIE || "";
if(!cookie) throw new Error("No YT_COOKIE in Variables");

let agent = undefined;
try{
  // If it's JSON array
  if(cookie.trim().startsWith("[")){
    agent = ytdl.createAgent(JSON.parse(cookie));
  }
} catch(e){}

let options = {
 filter: "audioonly",
 quality: "highestaudio",
 highWaterMark: 1 << 25,
 requestOptions: { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie } }
};
if(agent) options.agent = agent;

const stream = ytdl(url, options);
let write = fs.createWriteStream(filePath);
stream.pipe(write);

await new Promise((res, rej)=>{
 write.on("finish", res);
 write.on("error", rej);
 stream.on("error", rej);
});

await api.sendMessage({
 body: `🎧 ${video.title} | Cookie Mode ✅`,
 attachment: fs.createReadStream(filePath)
}, event.threadID, ()=>{
 if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

if(tmpMsg) api.unsendMessage(tmpMsg);

}catch(e){
if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
if(tmpMsg) api.unsendMessage(tmpMsg);
return api.sendMessage(`❌ YT_COOKIE Expired or Invalid\n${e.message}\n\nRe-copy new cookie from YouTube and update Railway Variables -> YT_COOKIE -> Redeploy`, event.threadID);
}
}
};
