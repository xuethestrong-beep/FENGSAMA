const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: {
    name: "music",
    aliases: ["song", "play"],
    version: "5.2",
    author: "FENG",
    role: 0,
    countDown: 10,
    category: "media",
    description: "Search YouTube and send audio (yt-search only, max 10 min)",
    guide: "{pn} <song>"
  },
  onStart: async function ({ api, event, args }) {
    const tid = event.threadID;
    const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
    if (!args.length) return api.sendMessage(`❌ Ex: ${prefix}music Arthur Nery`, tid);
    const query = args.join(" ").slice(0, 200);
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `yt_${Date.now()}_${Math.floor(Math.random() * 1e6)}.mp3`);
    let searching = null;
    const cleanup = async () => { await fs.unlink(filePath).catch(() => {}); };
    try {
      await fs.ensureDir(cacheDir);
      searching = await new Promise((res, rej) => api.sendMessage(`🔍 Searching YT: ${query}`, tid, (e, i) => e ? rej(e) : res(i))).catch(() => null);
      const search = await Promise.race([
        yts(query),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Search timed out")), 15000))
      ]);
      if (!search.videos?.length) throw new Error("No results");
      const video = search.videos[0];
      if (video.isLive) throw new Error("Live videos not supported.");
      if (!video.duration?.seconds || video.duration.seconds > 600) throw new Error("Too long (max 10 min)");
      const stream = ytdl(video.url, { filter: "audioonly", quality: "highestaudio" });
      const write = fs.createWriteStream(filePath);
      await new Promise((res, rej) => {
        const timer = setTimeout(() => { stream.destroy(); write.destroy(); rej(new Error("Download timed out")); }, 90000);
        stream.on("error", (e) => { clearTimeout(timer); rej(e); });
        write.on("error", (e) => { clearTimeout(timer); rej(e); });
        write.on("finish", () => { clearTimeout(timer); res(); });
        stream.pipe(write);
      });
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || stat.size < 1000) throw new Error("Download failed (empty file).");
      if (stat.size > 25 * 1024 * 1024) throw new Error("Too big >25MB");
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(() => {});
      searching = null;
      await api.sendMessage({ body: `🎵 ${video.title}\n${video.url}`, attachment: fs.createReadStream(filePath) }, tid);
      setTimeout(() => cleanup(), 5000);
    } catch (e) {
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(() => {});
      await cleanup();
      api.sendMessage(`❌ ${e.message}`, tid);
      console.error("[MUSIC]", e.message);
    }
  }
};
