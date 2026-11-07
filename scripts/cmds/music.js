const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const ytDlp = require('yt-dlp-exec');

module.exports = {
  name: "music",
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);
    const query = args.join(" ");
    const wait = await api.sendMessage(`🎧 FENG searching: ${query}`, event.threadID);
    
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');

    try {
      // Write cookie file from Railway variable
      if (process.env.YT_COOKIE) {
        await fs.writeFile(cookiePath, process.env.YT_COOKIE);
      }

      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found");
      const video = search.videos[0];

      await ytDlp(video.url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0,
        output: filePath,
        noPlaylist: true,
        cookies: process.env.YT_COOKIE ? cookiePath : undefined,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
      });

      const stat = await fs.stat(filePath);
      if (stat.size > 25 * 1024 * 1024) {
        await fs.remove(filePath);
        return api.sendMessage("❌ >25MB, try shorter.", event.threadID);
      }

      await api.sendMessage({ body: `🎵 ${video.title}`, attachment: fs.createReadStream(filePath) }, event.threadID);
      await fs.remove(filePath);
      api.unsendMessage(wait.messageID);
    } catch (e) {
      console.log("[MUSIC V2]", e.message);
      await fs.remove(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message.slice(0,150)}`, event.threadID);
      try{ api.unsendMessage(wait.messageID); }catch{}
    }
  }
        }
