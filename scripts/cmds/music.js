const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  name: "music",
  config: { name: "music", aliases: ["song", "play"] },

  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID, event.messageID);
    
    const query = args.join(" ").replace(/"/g, '').replace(/`/g, '');
    api.sendMessage(`🎧 Searching: ${query}`, event.threadID, event.messageID);

    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    try {
      // Handle YT_COOKIE from Railway ENV
      if (process.env.YT_COOKIE) {
        let c = process.env.YT_COOKIE.trim();
        if (c.startsWith('"') && c.endsWith('"')) { try { c = JSON.parse(c); } catch {} }
        if (c.startsWith('[')) {
          const cookies = JSON.parse(c);
          let out = "# Netscape HTTP Cookie File\n";
          for (const ck of cookies) {
            if(!ck.name) continue;
            out += `${ck.domain||'.youtube.com'}\t${ck.domain?.startsWith('.')?'TRUE':'FALSE'}\t${ck.path||'/'}\t${ck.secure?'TRUE':'FALSE'}\t${Math.round(ck.expirationDate||0)}\t${ck.name}\t${ck.value}\n`;
          }
          c = out;
        }
        await fs.writeFile(cookiePath, c);
      }

      const hasCookie = fs.existsSync(cookiePath) && (await fs.stat(cookiePath)).size > 100;
      
      // FIXED: ios client instead of android,web - this is what was failing
      const cmd = `yt-dlp ${hasCookie ? `--cookies "${cookiePath}"` : ''} --format "bestaudio[ext=m4a]/bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=ios,mweb" --extractor-args "youtube:player_skip=webpage" --force-ipv4 "ytsearch1:${query}" 2>&1`;

      console.log("[MUSIC] CMD:", cmd);
      const { stdout } = await execAsync(cmd, { timeout: 90000 });
      console.log("[MUSIC] LOG:", stdout.slice(-1000));

      if (!fs.existsSync(filePath)) throw new Error(`YouTube blocked. Update YT_COOKIE. Log: ${stdout.slice(-500)}`);
      
      const stat = await fs.stat(filePath);
      if (stat.size < 10000) throw new Error("Download blocked, file too small");

      await api.sendMessage({ 
        body: `🎵 ${query}`, 
        attachment: fs.createReadStream(filePath) 
      }, event.threadID, event.messageID);

    } catch (e) {
      console.error("[MUSIC ERROR]", e.message);
      api.sendMessage(`❌ Music error:\n${e.message.slice(0,500)}\n\nTip: Update YT_COOKIE in Railway`, event.threadID, event.messageID);
    } finally {
      await fs.remove(filePath).catch(()=>{});
    }
  }
        }
