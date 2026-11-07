const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  name: "music",
  config: { name: "music", aliases: ["song", "play"] },
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song>", event.threadID);
    const query = args.join(" ").replace(/"/g, '');
    
    api.sendMessage(`🎧 Searching: ${query}`, event.threadID);

    const cacheDir = '/app/cache';
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    try {
      await fs.writeFile(cookiePath, process.env.YT_COOKIE);
      const cmd = `yt-dlp --cookies "${cookiePath}" --format "bestaudio[ext=m4a]/bestaudio" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=android,web;po_token=android+un" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
      await execAsync(cmd, { timeout: 90000 });
      if (!fs.existsSync(filePath)) throw new Error("Download failed");
      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(filePath) }, event.threadID);
    } catch (e) {
      const msg = (e.stdout || e.message || "").slice(0,800);
      api.sendMessage(`❌ ${msg}`, event.threadID);
    } finally {
      fs.remove(filePath).catch(()=>{});
    }
  }
                            }
