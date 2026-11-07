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
      // 1. Write cookies from ENV (supports both formats)
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
        console.log(`[MUSIC] Cookie written: ${(await fs.stat(cookiePath)).size} bytes`);
      }

      const hasCookie = fs.existsSync(cookiePath) && (await fs.stat(cookiePath)).size > 200;

      // 2. Try strategy 1: WITH cookies + ios client (best)
      let cmd = `yt-dlp ${hasCookie ? `--cookies "${cookiePath}"` : ''} --format "bestaudio[ext=m4a]/bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=ios,mweb" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
      
      console.log("[MUSIC] Trying 1:", hasCookie ? "with cookies" : "no cookies");
      try {
        await execAsync(cmd, { timeout: 90000 });
      } catch (e) {
        console.log("[MUSIC] Try 1 failed, trying fallback without cookies + android client");
        // 3. Fallback: WITHOUT cookies + android client (works when Railway IP is flagged)
        cmd = `yt-dlp --format "bestaudio[ext=m4a]/bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 24M --no-playlist --extractor-args "youtube:player_client=android,web" --force-ipv4 --no-warnings "ytsearch1:${query}" 2>&1`;
        await execAsync(cmd, { timeout: 90000 });
      }

      if (!fs.existsSync(filePath)) throw new Error(`YouTube blocked. Railway IP is flagged. Try updating YT_COOKIE with a fresh login.`);
      
      const stat = await fs.stat(filePath);
      if (stat.size < 10000) throw new Error("Download blocked, file too small");

      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(filePath) }, event.threadID, event.messageID);

    } catch (e) {
      console.error("[MUSIC ERROR]", e.message);
      api.sendMessage(`❌ Music error:\n${e.message.slice(0,500)}\n\nTip: Export new cookies from YouTube using "Get cookies.txt LOCALLY" extension, then update YT_COOKIE in Railway and redeploy.`, event.threadID, event.messageID);
    } finally {
      await fs.remove(filePath).catch(()=>{});
    }
  }
              }
