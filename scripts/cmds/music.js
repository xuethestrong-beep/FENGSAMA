const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);

module.exports = {
  config: { name: "music", version: "5.6-debug", author: "FENG", countDown: 15, role: 0, category: "media" },
  onStart: async function ({ message, args, event, api }) {
    if (!args[0]) return message.reply("!music <name>");
    const query = args.join(" ").trim();

    let searchingID = null;
    try {
      const info = await message.reply(`🎧 Searching: ${query}`);
      searchingID = info.messageID;
    } catch {}

    const cacheDir = path.join(__dirname, "cache");
    const baseName = `m_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const base = path.join(cacheDir, baseName);
    const cookiePath = path.join(cacheDir, `cookies_${baseName}.txt`);

    try {
      await fs.ensureDir(cacheDir);
      const ytdlpArgs = ["-m", "yt_dlp", "--extractor-args", "youtube:player_client=android,mweb", "--js-runtimes", "deno,node", "-f", "bestaudio/best", "-x", "--audio-format", "mp3", "--audio-quality", "5", "-o", `${base}.%(ext)s`, `ytsearch1:${query}`, "--no-playlist", "--quiet"];

      if (process.env.YT_COOKIE) {
        await fs.writeFile(cookiePath, process.env.YT_COOKIE.replace(/\\n/g, "\n"));
        ytdlpArgs.push("--cookies", cookiePath);
      }

      const { stdout, stderr } = await execFileAsync("python3", ytdlpArgs, { timeout: 90000, maxBuffer: 10*1024*1024 });
      
      const files = await fs.readdir(cacheDir);
      const found = files.find(f => f.startsWith(baseName));
      if (!found) throw new Error(`NO_FILE - yt-dlp said: ${stderr || stdout || "nothing"}`);

      const finalFile = path.join(cacheDir, found);
      // Delete searching BEFORE send
      if (searchingID) await api.unsendMessage(searchingID).catch(()=>{});
      searchingID = null; // mark deleted

      await message.reply({ body: `🎵 ${query}`, attachment: fs.createReadStream(finalFile) });
      await fs.remove(finalFile).catch(()=>{});

    } catch (e) {
      console.error("[MUSIC-ERR]", e);
      const errMsg = String(e.message || e).slice(0, 400);
      if (searchingID) {
        // Edit searching to show error instead of deleting
        await api.editMessage?.(`❌ Failed: ${errMsg}`, searchingID).catch(async ()=>{
          await api.unsendMessage(searchingID).catch(()=>{});
          await message.reply(`❌ Failed: ${errMsg}`);
        });
      } else {
        await message.reply(`❌ Failed: ${errMsg}`);
      }
    } finally {
      try { const all = await fs.readdir(cacheDir); for (const f of all) if (f.startsWith(baseName)) await fs.remove(path.join(cacheDir, f)).catch(()=>{}); } catch {}
    }
  }
};
