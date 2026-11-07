const fs = require('fs-extra');
const path = require('path');
const play = require('play-dl');

module.exports = {
  name: "music",
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);
    const query = args.join(" ");
    const wait = await api.sendMessage(`🎧 FENG searching: ${query}`, event.threadID);
    
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

    try {
      // Use play-dl's own YouTube search - it bypasses Invalid URL error
      const ytResults = await play.search(query, { limit: 1, source: { youtube: "video" } });
      if (!ytResults.length) throw new Error("Not found on YouTube");
      const video = ytResults[0];

      const stream = await play.stream(video.url, { quality: 2 });
      const write = fs.createWriteStream(filePath);
      stream.stream.pipe(write);

      await new Promise((res, rej) => {
        write.on('finish', res);
        write.on('error', rej);
        stream.stream.on('error', rej);
        setTimeout(() => rej(new Error("Timeout - try again")), 50000);
      });

      const stat = await fs.stat(filePath);
      if (stat.size > 25 * 1024 * 1024) {
        await fs.remove(filePath);
        return api.sendMessage("❌ >25MB, try shorter song.", event.threadID);
      }

      await api.sendMessage({ body: `🎵 ${video.title}`, attachment: fs.createReadStream(filePath) }, event.threadID);
      await fs.remove(filePath);
      api.unsendMessage(wait.messageID);
    } catch (e) {
      console.log("[MUSIC]", e.message);
      await fs.remove(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message}`, event.threadID);
      try{ api.unsendMessage(wait.messageID); }catch{}
    }
  }
                                             }
