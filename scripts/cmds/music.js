const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);
const MAX_SIZE = 25 * 1024 * 1024;

module.exports = {
  config: {
    name: "music",
    version: "5.2",
    author: "FENG",
    countDown: 15,
    role: 0,
    description: "Search and download music from YouTube",
    category: "media",
    guide: "{pn} <song name>"
  },
  onStart: async function ({ message, args, event, api }) {
    if (!args[0]) return message.reply("🎵 Usage: !music <song name>\nEx: !music die with a smile");
    const query = args.join(" ").trim().slice(0, 100);
    if (!query) return message.reply("❌ Enter a song name");
    let searchInfo = null;
    try {
      try { await api.setMessageReaction("🔍", event.messageID, () => {}, true); } catch {}
      searchInfo = await message.reply(`🎧 Searching: ${query}`);
    } catch {}
    const cacheDir = path.join(__dirname, "cache");
    const baseName = `m_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const base = path.join(cacheDir, baseName);
    const cookiePath = path.join(cacheDir, `cookies_${baseName}.txt`);
    try {
      await fs.ensureDir(cacheDir);
      const ytdlpArgs = [
        "-m", "yt_dlp",
        "--extractor-args", "youtube:player_client=android,mweb",
        "--js-runtimes", "deno,node",
        "-f", "bestaudio/best",
        "-x", "--audio-format", "mp3",
        "--audio-quality", "5",
        "--match-filter", "duration < 600",
        "-o", `${base}.%(ext)s`,
        `ytsearch1:${query}`,
        "--no-playlist", "--quiet", "--no-warnings"
      ];
      if (process.env.YT_COOKIE) {
        await fs.writeFile(cookiePath, process.env.YT_COOKIE.replace(/\\n/g, "\n"));
        ytdlpArgs.push("--cookies", cookiePath);
      }
      await execFileAsync("python3", ytdlpArgs, { timeout: 120000, maxBuffer: 1024 * 1024 });
      const files = await fs.readdir(cacheDir);
      const found = files.find(f => f.startsWith(baseName) && f.endsWith(".mp3"));
      if (!found) throw new Error("NO_FILE");
      const finalFile = path.join(cacheDir, found);
      const stat = await fs.stat(finalFile);
      if (stat.size > MAX_SIZE) throw new Error("TOO_BIG");
      if (stat.size === 0) throw new Error("NO_FILE");
      const mid = searchInfo?.messageID || searchInfo?.messageID;
      if (mid) api.unsendMessage(mid).catch(() => {});
      try { await api.setMessageReaction("✅", event.messageID, () => {}, true); } catch {}
      await message.reply({ body: `🎵 ${query}`, attachment: fs.createReadStream(finalFile) });
    } catch (e) {
      const mid = searchInfo?.messageID;
      if (mid) api.unsendMessage(mid).catch(() => {});
      try { await api.setMessageReaction("❌", event.messageID, () => {}, true); } catch {}
      if (e.message === "TOO_BIG") return message.reply("❌ Too long / too big (>25MB). Try a shorter song (under 10 min).");
      if (e.message === "NO_FILE") return message.reply("❌ Not found. Try a different song name.");
      if (String(e.message || "").includes("timed out") || e.killed) return message.reply("❌ Timed out. Try again.");
      return message.reply("❌ Failed: cookie expired or yt-dlp blocked.\nFix: update yt-dlp or check YT_COOKIE");
    } finally {
      try {
        const all = await fs.readdir(cacheDir);
        for (const f of all) {
          if (f.startsWith(baseName)) await fs.remove(path.join(cacheDir, f)).catch(() => {});
        }
      } catch {}
    }
  }
};
