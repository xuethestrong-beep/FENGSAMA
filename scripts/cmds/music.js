const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);
const MAX_SIZE = 25 * 1024 * 1024;

module.exports = {
  config: { name: "music", version: "5.7-fix", author: "FENG", countDown: 10, role: 0, category: "media", guide: "{pn} <song name>" },
  onStart: async function ({ message, args, event, api }) {
    if (!args[0]) return message.reply("🎵 Usage: !music <song name>");
    const query = args.join(" ").trim().slice(0, 100);

    let searchingMsg = null;
    try { searchingMsg = await message.reply(`🎧 Searching: ${query}`); } catch {}
    const searchingID = searchingMsg?.messageID;

    const cacheDir = path.join(__dirname, "cache");
    const baseName = `m_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const base = path.join(cacheDir, baseName);
    const cookiePath = path.join(cacheDir, `cookies_${baseName}.txt`);

    const safeUnsend = async (id) => { try { if (id) await api.unsendMessage(id); } catch {} };

    try {
      await fs.ensureDir(cacheDir);

      const ytdlpArgs = [
        "--extractor-args", "youtube:player_client=android,ios",
        "-f", "bestaudio[ext=m4a]/bestaudio/best",
        "-x", "--audio-format", "mp3",
        "--audio-quality", "5",
        "--match-filter", "duration < 600",
        "-o", `${base}.%(ext)s`,
        `ytsearch1:${query}`,
        "--no-playlist", "--quiet", "--no-warnings"
      ];

      if (process.env.YT_COOKIE) {
        try {
          await fs.writeFile(cookiePath, process.env.YT_COOKIE.replace(/\\n/g, "\n"));
          ytdlpArgs.push("--cookies", cookiePath);
        } catch {}
      }

      // Try yt-dlp binary first, then python3, then python
      let lastErr;
      for (const cmd of ["yt-dlp", "python3", "python"]) {
        try {
          if (cmd === "yt-dlp") {
            await execFileAsync("yt-dlp", ytdlpArgs, { timeout: 120000 });
          } else {
            await execFileAsync(cmd, ["-m", "yt_dlp", ...ytdlpArgs], { timeout: 120000 });
          }
          lastErr = null;
          break;
        } catch (e) { lastErr = e; if (!String(e.message).includes("ENOENT") && !String(e.message).includes("not found")) break; }
      }
      if (lastErr) throw lastErr;

      const files = await fs.readdir(cacheDir);
      const found = files.find(f => f.startsWith(baseName));
      if (!found) throw new Error("NO_FILE - yt-dlp found nothing, need YT_COOKIE");
      
      const finalFile = path.join(cacheDir, found);
      const stat = await fs.stat(finalFile);
      if (stat.size > MAX_SIZE) throw new Error("TOO_BIG");

      await safeUnsend(searchingID);
      await message.reply({ body: `🎵 ${query}`, attachment: fs.createReadStream(finalFile) });

    } catch (e) {
      await safeUnsend(searchingID);
      console.error("[MUSIC]", e);
      return message.reply(`❌ Failed: ${String(e.message).slice(0, 300)}`);
    } finally {
      try { const all = await fs.readdir(cacheDir); for (const f of all) if (f.startsWith(baseName)) await fs.remove(path.join(cacheDir, f)); } catch {}
    }
  }
};
