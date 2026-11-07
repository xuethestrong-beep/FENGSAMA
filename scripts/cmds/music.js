const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

module.exports = {
  name: "music",
  description: "Send music from YouTube",
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);
    const query = args.join(" ");
    const wait = await api.sendMessage(`🎧 FENG searching: ${query}`, event.threadID);
    try {
      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found");
      const video = search.videos[0];
      const filePath = path.join(__dirname, `../../cache/${Date.now()}.mp3`);
      const stream = ytdl(video.url, { filter: 'audioonly', quality: 'lowestaudio', highWaterMark: 1 << 18 });
      const write = fs.createWriteStream(filePath);
      stream.pipe(write);
      await new Promise((res, rej) => { write.on('finish', res); write.on('error', rej); stream.on('error', rej); });
      const size = (await fs.stat(filePath)).size;
      if (size > 25 * 1024 * 1024) { await fs.unlink(filePath); return api.sendMessage("❌ >25MB, try shorter song.", event.threadID); }
      await api.sendMessage({ body: `🎵 ${video.title}`, attachment: fs.createReadStream(filePath) }, event.threadID);
      await fs.unlink(filePath);
      api.unsendMessage(wait.messageID);
    } catch (e) {
      api.sendMessage(`❌ ${e.message}`, event.threadID);
      api.unsendMessage(wait.messageID);
    }
  }
  }
