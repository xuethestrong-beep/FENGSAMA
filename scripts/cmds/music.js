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
      // 1. Write cookies from ENV
      let hasCookie = false;
      if (process.env.YT_COOKIE && process.env.YT_COOKIE.length > 200) {
        let c = process.env.YT_COOKIE.trim();
        // Handle JSON export format
        if (c.startsWith('[')) {
          try {
            const cookies = JSON.parse(c);
            let out = "# Netscape HTTP Cookie File\n";
            for (const ck of cookies) {
              if(!ck.name) continue;
              out += `${ck.domain||'.youtube.com'}\t${ck.domain?.startsWith('.')?'TRUE':'FALSE'}\t${ck.path||'/'}\t${ck.secure?'TRUE':'FALSE'}\t${Math.round(ck.expirationDate||0)}\t${ck.name}\t${ck.value}\n`;
            }
            c = out;
          } catch {}
        }
        await fs.writeFile(cookiePath, c);
        const size = (await fs.stat(cookiePath)).size;
        console.log(`[MUSIC] Cookie written: ${size} bytes`);
        hasCookie = size > 500;
      } else {
        console.log("[MUSIC] No YT_COOKIE found or too small");
      }

      if (!hasCookie) {
        throw new Error("YT_COOKIE is missing or empty. Export cookies.txt from youtube.com using 'Get cookies.txt LOCALLY' and paste ALL lines into Railway Variable YT_COOKIE. Current size is <500 bytes.");
      }

      // 2. FIXED COMMAND - always use cookies + web client
      const cmd = `yt-dlp --cookies "${cookiePath}" --format "bestaudio[ext=m4a]/bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${filePath}" --max-filesize 25M --no-playlist --extractor-args "youtube:player_client=web" --force-ipv4 --no-warnings --no-check-certificate "ytsearch1:${query}" 2>&1`;
      
      console.log("[MUSIC] Executing with cookies + web client");
      const { stdout, stderr } = await execAsync(cmd, { timeout: 90000 });
      console.log(stdout.slice(0,500));

      if (!fs.existsSync(filePath)) {
        throw new Error(`Download failed. Output: ${stdout.slice(0,400)}\nUpdate YT_COOKIE with fresh cookies and make sure you're logged in to YouTube when exporting.`);
      }

      const stat = await fs.stat(filePath);
      if (stat.size < 10000) throw new Error("File too small, YouTube blocked it. Get fresh cookies.");

      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(filePath) }, event.threadID, event.messageID);

    } catch (e) {
      console.error("[MUSIC ERROR]", e.message);
      api.sendMessage(`❌ Music error:\n${e.message.slice(0,800)}`, event.threadID, event.messageID);
    } finally {
      await fs.remove(filePath).catch(()=>{});
    }
  }
    }
