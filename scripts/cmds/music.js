const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core");
const { HttpsProxyAgent } = require("https-proxy-agent");

const CACHE_DIR = path.join(__dirname, "cache");
const MAX_SIZE = 25 * 1024 * 1024;

const RAW_PROXY = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTP_PRO || process.env.HTTPS_PROXY || null;
function cleanProxy(url) {
  if (!url) return null;
  try { return new URL(url.trim().replace(/^["']|["']$/g, "")).toString(); } catch { return url; }
}
const PROXY_URL = cleanProxy(RAW_PROXY);
let agent = undefined;
if (PROXY_URL) {
  try { agent = new HttpsProxyAgent(PROXY_URL); console.log("[MUSIC] Proxy:", PROXY_URL.replace(/:[^:@]*@/, ":****@")); }
  catch (e) { console.log("[MUSIC] Proxy fail:", e.message); }
}

async function safeUnsend(m, id) { if (!id) return; try { await m.unsend(id); } catch {} }
function removeFile(f) { try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

async function downloadWithYTDL(videoURL) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `music_${Date.now()}_${Math.random().toString(36).slice(2,6)}.mp3`);
  return new Promise((resolve, reject) => {
    const opts = {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
      requestOptions: agent ? { agent } : {}
    };
    let size = 0;
    const stream = ytdl(videoURL, opts);
    const write = fs.createWriteStream(file);
    stream.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_SIZE) { stream.destroy(); write.destroy(); removeFile(file); reject(new Error("File >25MB")); }
    });
    stream.pipe(write);
    write.on("finish", () => resolve(file));
    write.on("error", e => { removeFile(file); reject(e); });
    stream.on("error", e => { removeFile(file); reject(e); });
  });
}

async function processSong({ message, video }) {
  let file, procMsg;
  try {
    procMsg = await message.reply(`⬇️ Downloading: ${video.title}`);
    file = await downloadWithYTDL(video.url);
    await safeUnsend(message, procMsg?.messageID);
    await message.reply({
      body: `🎶 ${video.title}\n👤 ${video.author?.name||"Unknown"}\n⏱ ${video.timestamp||"?"}`,
      attachment: fs.createReadStream(file)
    });
  } catch (err) {
    console.error("[MUSIC] Error:", err.message);
    await safeUnsend(message, procMsg?.messageID);
    const msg = err.message.includes("403") ? "YouTube blocked. Proxy may be dead, try again." : err.message.includes("410") ? "Video unavailable" : err.message;
    await message.reply(`❌ Music error: ${msg}`);
  } finally { removeFile(file); }
}

async function startFunction({ message, args, event }) {
  if (!args?.length) return message.reply("🎵 Usage: music <song> | music -s <song>");
  let showList = false; if (args[0] === "-s") { showList = true; args.shift(); }
  const query = args.join(" ").trim(); if (!query) return message.reply("❌ Enter song name");
  let processing;
  try {
    processing = await message.reply(`🔍 Searching "${query}"...`);
    const search = await yts(query); const videos = search?.videos || [];
    if (!videos.length) { await safeUnsend(message, processing?.messageID); return message.reply("❌ No results"); }
    if (!showList) { await safeUnsend(message, processing?.messageID); return processSong({ message, video: videos[0] }); }
    const top = videos.slice(0,6); let out = `🔍 Results for "${query}"\n\n`;
    top.forEach((v,i)=>{ out += `${i+1}. ${v.title}\n👤 ${v.author?.name||"Unknown"}\n⏱ ${v.timestamp||"?"}\n\n`; });
    out += `👉 Reply 1-${top.length}`;
    await safeUnsend(message, processing?.messageID);
    const info = await message.reply(out);
    if (info?.messageID && global.GoatBot?.onReply) global.GoatBot.onReply.set(info.messageID, { commandName: module.exports.config.name, author: event.senderID, videos: top });
  } catch (err) { console.error("[MUSIC] Search error:", err); await safeUnsend(message, processing?.messageID); return message.reply("❌ Search failed: " + err.message); }
}

module.exports = {
  config: { name: "music", aliases: ["song"], version: "3.0-ytdl-proxy", author: "ST Fixed", role: 0, category: "music" },
  onStart: startFunction,
  ST: startFunction,
  onReply: async function ({ message, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author)) return message.reply("⚠️ Not your request");
    const choice = parseInt(String(event.body||"").trim(),10);
    if (!Number.isInteger(choice) || choice<1 || choice>Reply.videos.length) return message.reply(`❌ Reply 1-${Reply.videos.length}`);
    return processSong({ message, video: Reply.videos[choice-1] });
  }
};
