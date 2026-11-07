const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  name: "music",
  config: { 
    name: "music", 
    aliases: ["song", "play"],
    version: "2.0",
    author: "Feng",
    role: 0,
    description: "Download music from YouTube"
  },
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);

    const query = args.join(" ").replace(/"/g, '');
    const cacheDir = '/app/cache';
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    // 1. Send searching and save its ID
    let searchMsgID = null;
    api.sendMessage(`🎧 Searching: ${query}`, event.threadID, (err, info) => {
      if (info) searchMsgID = info.messageID;
    });

    try {
      // 2. Check cookies
      if (!process.env.YT_COOKIE || process.env.YT_COOKIE.length < 500) {
        throw new Error("YT_COOKIE is empty or too small. Export fresh cookies.txt from YouTube");
      }
      await fs.writeFile(cookiePath, process.env.YT_COOKIE);

      // 3. Download - FIXED: bestaudio/best + android_music client
      const cmd = `yt-dlp --cookies "${cookiePath}" -f "bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=android_music,web;po_token=android_music+un,web+safari" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
      
      console.log("[MUSIC] Starting download:", query);
      const { stdout } = await execAsync(cmd, { timeout: 90000 });
      console.log("[MUSIC] yt-dlp done");

      if (!fs.existsSync(filePath)) {
        throw new Error(stdout.slice(-1000));
      }

      // 4. Auto delete searching message
      if (searchMsgID) {
        try { api.unsendMessage(searchMsgID); } catch {}
      }

      // 5. Send MP3
      const stat = await fs.stat(filePath);
      console.log(`[MUSIC] Sending ${(stat.size/1024/1024).toFixed(2)} MB`);
      await api.sendMessage({ 
        body: `🎵 ${query}`, 
        attachment: fs.createReadStream(filePath) 
      }, event.threadID);

    } catch (e) {
      if (searchMsgID) {
        try { api.unsendMessage(searchMsgID); } catch {}
      }
      const msg = (e.stdout || e.stderr || e.message || "Unknown error").toString().slice(0, 900);
      console.log("[MUSIC ERROR]", msg);
      api.sendMessage(`❌ Failed: ${msg}`, event.threadID);
    } finally {
      fs.remove(filePath).catch(()=>{});
      fs.remove(cookiePath).catch(()=>{});
    }
  }
                                                              }
