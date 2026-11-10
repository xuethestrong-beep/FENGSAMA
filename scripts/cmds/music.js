const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);
const MAX_SIZE = 25 * 1024 * 1024;

module.exports = {
  config: { name: "music", version: "5.4", author: "FENG", countDown: 15, role: 0, description: "Search and download music", category: "media", guide: "{pn} <song name>" },
  onStart: async function ({ message, args, event, api }) {
    if (!args[0]) return message.reply("🎵 Usage: !music <song name>");
    const query = args.join(" ").trim().slice(0, 100);

    let searchingID = null;
    try {
      const info = await message.reply(`🎧 Searching: ${query}`);
      searchingID = info?.messageID || info?.messageID || null;
    } catch {}
    try { await api.setMessageReaction("🔍", event.messageID, () => {}, true); } catch {}

    const cacheDir = path.join(__dirname, "cache");
    const baseName = `m_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const base = path.join(cacheDir, baseName);
    const cookiePath = path.join(cacheDir, `cookies_${baseName}.txt`);

    try {
      await fs.ensureDir(cacheDir);
      const ytdlpArgs = ["-m", "yt_dlp", "--extractor-args", "youtube:player_client=android,ios", "-f", "bestaudio[ext=m4a]/bestaudio/best", "-x", "--audio-format", "mp3", "--audio-quality", "5", "--match-filter", "duration < 600", "-o", `${base}.%(ext)s`, `ytsearch1:${query}`, "--no-playlist", "--quiet", "--no-warnings", "--no-cache-dir"];
      if (process.env.YT_COOKIE) {
        await fs.writeFile(cookiePath, process.env.YT_COOKIE.replace(/\\n/g, "\n"));
        ytdlpArgs.push("--cookies", cookiePath);
      }
      try { await execFileAsync("python3", ytdlpArgs, { timeout: 120000 }); } 
      catch { await execFileAsync("python", ytdlpArgs, { timeout: 120000 }); }

      const files = await fs.readdir(cacheDir);
      const found = files.find(f => f.startsWith(baseName));
      if (!found) throw new Error("NO_FILE");
      const finalFile = path.join(cacheDir, found);
      const stat = await fs.stat(finalFile);
      if (stat.size > MAX_SIZE) throw new Error("TOO_BIG");

      // DELETE SEARCHING MESSAGE
      if (searchingID) await api.unsendMessage(searchingID).catch(()=>{});
      
      try { await api.setMessageReaction("✅", event.messageID, ()=>{}, true); } catch {}
      await message.reply({ body: `🎵 ${query}`, attachment: fs.createReadStream(finalFile) });

    } catch (e) {
      if (searchingID) await api.unsendMessage(searchingID).catch(()=>{});
      try { await api.setMessageReaction("❌", event.messageID, ()=>{}, true); } catch {}
      if (e.message==="TOO_BIG") return message.reply("❌ Too big (>25MB)");
      if (e.message==="NO_FILE") return message.reply("❌ Not found");
      return message.reply(`❌ Failed: ${String(e.message).slice(0,150)}`);
    } finally {
      try { const all = await fs.readdir(cacheDir); for (const f of all) if (f.startsWith(baseName)) await fs.remove(path.join(cacheDir, f)).catch(()=>{}); } catch {}
    }
  }
};
