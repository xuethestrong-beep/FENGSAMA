const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
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
      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found");
      const video = search.videos[0];

      const stream = await play.stream(video.url, { quality: 2 }); // 2 = lowest audio
      const write = fs.createWriteStream(filePath);
      stream.stream.pipe(write);

      await new Promise((res, rej) => {
        write.on('finish', res);
        write.on('error', rej);
        stream.stream.on('error', rej);
        setTimeout(() => rej(new Error("Timeout - YouTube blocked")), 45000);
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
      console.log("[MUSIC]", e.message);
      await fs.remove(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message}`, event.threadID);
      try{ api.unsendMessage(wait.messageID); }catch{}
    }
  }
                                       }
