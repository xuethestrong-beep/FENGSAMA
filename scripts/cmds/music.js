const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const play = require("play-dl");
const { randomUUID } = require("crypto");
const MAX_DURATION = 600;
const MAX_SIZE = 25 * 1024 * 1024;
const SEARCH_TIMEOUT = 15000;
const INFO_TIMEOUT = 20000;
const DOWNLOAD_TIMEOUT = 60000;
function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${label} timeout`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
async function safeUnsend(api, id) {
  if (!id) return;
  try { await api.unsendMessage(id); } catch (e) { console.log("Unsend failed:", e.message); }
}
async function downloadWithLimit(stream, filePath) {
  let bytes = 0;
  await withTimeout(new Promise((resolve, reject) => {
    const write = fs.createWriteStream(filePath);
    const onData = (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_SIZE) {
        try { stream.destroy(); } catch {}
        try { write.destroy(); } catch {}
        reject(new Error("Audio >25MB"));
      }
    };
    stream.on("data", onData);
    stream.on("error", (e) => { try { write.destroy(); } catch {} reject(e); });
    write.on("error", reject);
    write.on("finish", resolve);
    stream.pipe(write);
  }), DOWNLOAD_TIMEOUT, "Download");
}
module.exports = {
  config: { name: "music", aliases: ["song", "play"], version: "6.1-fixed", author: "Feng - Fixed", role: 0, countDown: 10, category: "music", description: "Search and download music from YouTube", guide: "{pn} <song name>" },
  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("Use: !music <song name>");
    if (query.length > 200) return message.reply("Query too long");
    const filePath = path.join(__dirname, "cache", `${Date.now()}_${randomUUID().slice(0, 6)}.mp3`);
    try { fs.ensureDirSync(path.join(__dirname, "cache")); } catch {}
    let tmpMsg = null;
    try {
      const s = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
      tmpMsg = s?.messageID || null;
    } catch {}
    try {
      const search = await withTimeout(yts(query), SEARCH_TIMEOUT, "Search");
      if (!search?.videos?.length) throw new Error("No results");
      const video = search.videos[0];
      if (!video?.videoId) throw new Error("No results");
      if (video.duration?.seconds && video.duration.seconds > MAX_DURATION) throw new Error(`Video too long: ${Math.floor(video.duration.seconds / 60)}m (max 10m)`);
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      const yt_info = await withTimeout(play.video_info(url), INFO_TIMEOUT, "Video info");
      const streamInfo = await withTimeout(play.stream_from_info(yt_info), INFO_TIMEOUT, "Stream info");
      if (!streamInfo?.stream) throw new Error("No stream");
      await downloadWithLimit(streamInfo.stream, filePath);
      const stat = await fs.stat(filePath);
      if (!stat.size || stat.size > MAX_SIZE) throw new Error("Audio >25MB or empty");
      await safeUnsend(api, tmpMsg);
      tmpMsg = null;
      await message.reply({ body: `🎵 ${video.title}\n👤 ${video.author?.name || "Unknown"}`, attachment: fs.createReadStream(filePath) });
    } catch (e) {
      const msg = String(e?.message || e);
      console.log("MUSIC ERROR:", msg);
      await safeUnsend(api, tmpMsg);
      let userMsg = "⚠️ Music failed, please try again later.";
      if (msg.includes("No results")) userMsg = "❌ No results found.";
      else if (msg.includes("too long")) userMsg = `❌ ${msg}`;
      else if (msg.includes(">25MB")) userMsg = "❌ Audio too large (>25MB), try a shorter song.";
      else if (msg.includes("timeout")) userMsg = "⏳ YouTube timed out, please try again.";
      else if (msg.includes("403") || msg.includes("Sign in") || msg.includes("bot")) userMsg = "⚠️ YouTube blocked this request (403), try again later.";
      return message.reply(userMsg);
    } finally {
      try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch {}
    }
  }
};
