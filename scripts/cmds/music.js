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
    version: "2.2",
    author: "Feng",
    role: 0,
    description: "Download music from YouTube"
  },
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);
    const query = args.join(" ").replace(/"/g, '');
    const cacheDir = '/tmp/cache';
    await fs.ensureDir(cacheDir);
    const baseName = `${Date.now()}`;
    const basePath = path.join(cacheDir, baseName);
    const cookiePath = path.join(cacheDir, 'cookies.txt');
    let searchMsgID = null;
    api.sendMessage(`🎧 Searching: ${query}`, event.threadID, (err, info) => {
      if (info) searchMsgID = info.messageID;
    });
    try {
      let cookieArg = "";
      if (process.env.YT_COOKIE && process.env.YT_COOKIE.length > 200) {
        let cookieContent = process.env.YT_COOKIE;
        if (cookieContent.includes('\\n')) cookieContent = cookieContent.replace(/\\n/g, '\n');
        await fs.writeFile(cookiePath, cookieContent);
        cookieArg = `--cookies "${cookiePath}"`;
      }
      const cmd = `yt-dlp ${cookieArg} -f "bestaudio[ext=m4a]/bestaudio/best" -x --audio-format mp3 --audio-quality 5 -o "${basePath}.%(ext)s" --no-playlist --extractor-args "youtube:player_client=android,web" --no-warnings --geo-bypass "ytsearch1:${query}" 2>&1`;
      const { stdout } = await execAsync(cmd, { timeout: 120000 });
      let finalFile = `${basePath}.mp3`;
      if (!fs.existsSync(finalFile)) {
        const files = await fs.readdir(cacheDir);
        const found = files.find(f => f.startsWith(baseName));
        if (found) finalFile = path.join(cacheDir, found);
      }
      if (!fs.existsSync(finalFile)) throw new Error(stdout.slice(-1500));
      if (searchMsgID) { try { api.unsendMessage(searchMsgID); } catch {} }
      await api.sendMessage({ body: `🎵 ${query}`, attachment: fs.createReadStream(finalFile) }, event.threadID);
      await fs.remove(finalFile).catch(()=>{});
    } catch (e) {
      if (searchMsgID) { try { api.unsendMessage(searchMsgID); } catch {} }
      const msg = (e.stdout || e.message || "Unknown error").toString().slice(0, 900);
      console.log("[MUSIC ERROR]", msg);
      api.sendMessage(`❌ Failed: ${msg}`, event.threadID);
    } finally {
      fs.remove(cookiePath).catch(()=>{});
    }
  }
            }
