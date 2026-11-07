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
    api.sendMessage(`🎧 Searching: ${query}`, event.threadID, event.messageID);
    
    const cacheDir = '/app/cache';
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    try {
      if (!process.env.YT_COOKIE || process.env.YT_COOKIE.length < 500) throw new Error("YT_COOKIE too small. Paste full cookies.txt");
      await fs.writeFile(cookiePath, process.env.YT_COOKIE);
      console.log(`[MUSIC] Cookie OK: ${(await fs.stat(cookiePath)).size} bytes`);

      // NEW: Use tv + mweb clients - web client is blocked for search now
      const cmd = `yt-dlp --cookies "${cookiePath}" --format "bestaudio" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=tv,mweb" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
      
      console.log(`[MUSIC] CMD: ${cmd.slice(0,100)}`);
      const { stdout } = await execAsync(cmd, { timeout: 90000 });
      
      if (!fs.existsSync(filePath)) throw new Error(stdout.slice(0,1500));
      
      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(filePath) }, event.threadID, event.messageID);
    } catch (e) {
      const msg = e.stdout || e.stderr || e.message;
      console.log("[MUSIC ERROR FULL]", msg.slice(0,2000));
      api.sendMessage(`❌ Music error:\n${msg.slice(0,1000)}`, event.threadID, event.messageID);
    } finally {
      fs.remove(filePath).catch(()=>{});
    }
  }
  }
