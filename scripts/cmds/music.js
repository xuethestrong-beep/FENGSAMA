const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { randomUUID } = require("crypto");
const ytdlp = require("yt-dlp-exec");

const MAX_DURATION = 600;
const MAX_SIZE = 25 * 1024 * 1024;
const CACHE = path.join(__dirname, "cache");

const RAW_PROXY = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY || null;
const PROXY = RAW_PROXY ? RAW_PROXY.trim().replace(/^["']|["']$/g, "") : null;

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
async function safeUnsend(api, id) {
  if (!id) return;
  try { await api.unsendMessage(id); } catch {}
}

module.exports = {
  config: {
    name: "music",
    aliases: ["song", "play"],
    version: "6.3-ytdlp-proxy",
    author: "Feng - Fixed",
    role: 0,
    countDown: 10,
    category: "music",
    description: "Search and download music",
    guide: "{pn} <song name>"
  },
  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("Use: !music <song name>");
    if (query.length > 200) return message.reply("Query too long");

    const filePath = path.join(CACHE, `${Date.now()}_${randomUUID().slice(0, 6)}.mp3`);
    try { fs.ensureDirSync(CACHE); } catch {}

    let tmpMsg = null;
    try {
      const s = await api.sendMessage(`🔍 Searching: ${query}${PROXY ? " [proxy]" : ""}...`, event.threadID);
      tmpMsg = s?.messageID || null;
    } catch {}

    try {
      const search = await withTimeout(yts(query), 15000, "Search");
      if (!search?.videos?.length) throw new Error("No results");
      const video = search.videos[0];
      if (video.duration?.seconds && video.duration.seconds > MAX_DURATION)
        throw new Error(`Video too long: ${Math.floor(video.duration.seconds / 60)}m (max 10m)`);

      const url = `https://www.youtube.com/watch?v=${video.videoId}`;

      // yt-dlp options with proxy
      const opts = {
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: 0,
        output: filePath,
        noPlaylist: true,
        maxFilesize: "25M",
        quiet: true,
        noWarnings: true,
        addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"],
        // add proxy if available
        ...(PROXY ? { proxy: PROXY } : {})
      };

      console.log("[MUSIC] Downloading:", video.title, "Proxy:", !!PROXY);
      await withTimeout(ytdlp(url, opts), 90000, "Download");

      const stat = await fs.stat(filePath);
      if (!stat.size || stat.size > MAX_SIZE) throw new Error("Audio >25MB or empty");

      await safeUnsend(api, tmpMsg);
      tmpMsg = null;

      await message.reply({
        body: `🎵 ${video.title}\n👤 ${video.author?.name || "Unknown"}\n⏱ ${video.timestamp || ""}`,
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {
      const msg = String(e?.message || e);
      console.log("MUSIC ERROR:", msg);
      await safeUnsend(api, tmpMsg);
      let userMsg = "⚠️ Music failed, please try again later.";
      if (msg.includes("No results")) userMsg = "❌ No results found.";
      else if (msg.includes("too long")) userMsg = `❌ ${msg}`;
      else if (msg.includes(">25MB") || msg.includes("empty")) userMsg = "❌ Audio too large (>25MB) or empty, try shorter song.";
      else if (msg.includes("timeout")) userMsg = "⏳ YouTube timed out, please try again.";
      else if (msg.includes("403") || msg.includes("Sign in") || msg.includes("bot") || msg.includes("Forbidden")) userMsg = "⚠️ YouTube blocked (403). Proxy may be down. Try again or check PROXY_URL.";
      else userMsg = `❌ Music error: ${msg.slice(0, 150)}`;
      return message.reply(userMsg);
    } finally {
      try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch {}
    }
  },
  // For ST-BOT compatibility
  ST: async function (props) { return module.exports.onStart(props); }
};
