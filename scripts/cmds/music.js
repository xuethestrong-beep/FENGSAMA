const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  name: "music",
  config: { name: "music", aliases: ["song", "play"] },
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song>", event.threadID, event.messageID);
    const query = args.join(" ").replace(/"/g, '');
    
    // Send searching and save its ID to delete later
    let searchMsgID = null;
    try {
      const info = await new Promise((res) => {
        api.sendMessage(`🎧 Searching: ${query}`, event.threadID, (err, data) => res(data), event.messageID);
      });
      searchMsgID = info?.messageID;
    } catch {}

    const cacheDir = '/app/cache';
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    try {
      if (!process.env.YT_COOKIE || process.env.YT_COOKIE.length < 500) throw new Error("YT_COOKIE too small");
      await fs.writeFile(cookiePath, process.env.YT_COOKIE);

      // FIXED CLIENT: android + web with po_token bypass
      const cmd = `yt-dlp --cookies "${cookiePath}" --format "bestaudio[ext=m4a]/bestaudio" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=android,web;po_token=android+un" --user-agent "com.google.android.youtube/19.29.37 (Linux; U; Android 14) gzip" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
      
      const { stdout } = await execAsync(cmd, { timeout: 90000 });
      
      if (!fs.existsSync(filePath)) throw new Error(stdout.slice(0,1200));
      
      // Delete searching message BEFORE sending song
      if (searchMsgID) api.unsendMessage(searchMsgID);

      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(filePath) }, event.threadID, event.messageID);
    } catch (e) {
      const msg = e.stdout || e.stderr || e.message;
      // Delete searching message even on error
      if (searchMsgID) api.unsendMessage(searchMsgID);
      console.log("[MUSIC ERROR FULL]", msg.slice(0,2000));
      api.sendMessage(`❌ ${msg.slice(0,800)}`, event.threadID, event.messageID);
    } finally {
      fs.remove(filePath).catch(()=>{});
    }
  }
        }
