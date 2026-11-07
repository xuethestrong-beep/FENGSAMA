const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const { exec } = require('child_process');

module.exports = {
  name: "music",
  description: "Send music from YouTube",
  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("Usage: !music <song name>", event.threadID);
    const query = args.join(" ");
    const wait = await api.sendMessage(`🎧 FENG searching: ${query}`, event.threadID);
    
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);
    
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const tempPath = path.join(cacheDir, `${Date.now()}_temp.webm`);

    try {
      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found on YouTube");
      const video = search.videos[0];
      
      // Download lowest audio to stay under 25MB
      const stream = ytdl(video.url, { 
        filter: 'audioonly', 
        quality: 'lowestaudio',
        highWaterMark: 1 << 20
      });
      
      const write = fs.createWriteStream(tempPath);
      stream.pipe(write);

      await new Promise((res, rej) => {
        write.on('finish', res);
        write.on('error', rej);
        stream.on('error', rej);
        setTimeout(() => rej(new Error("Download timeout - YouTube blocked")), 60000);
      });

      // Convert to mp3 128k to reduce size (needs ffmpeg)
      await new Promise((res, rej) => {
        exec(`ffmpeg -y -i "${tempPath}" -vn -ab 128k -ar 44100 "${filePath}"`, (err) => {
          if (err) {
            // If ffmpeg not installed, just use temp file
            fs.copy(tempPath, filePath).then(res).catch(rej);
          } else res();
        });
      });

      await fs.remove(tempPath).catch(()=>{});
      const stat = await fs.stat(filePath);
      
      if (stat.size > 25 * 1024 * 1024) {
        await fs.remove(filePath);
        return api.sendMessage(`❌ File too big (${(stat.size/1024/1024).toFixed(1)}MB) >25MB. Try shorter song.`, event.threadID);
      }

      if (stat.size < 100 * 1024) {
        throw new Error("Download failed - YouTube blocked Railway IP. Try again in 1 min.");
      }

      await api.sendMessage({ 
        body: `🎵 ${video.title}\n⏱️ ${video.timestamp} | 👁️ ${video.views}`,
        attachment: fs.createReadStream(filePath) 
      }, event.threadID);

      await fs.remove(filePath);
      api.unsendMessage(wait.messageID);

    } catch (e) {
      console.log("[MUSIC ERROR]", e.message);
      await fs.remove(filePath).catch(()=>{});
      await fs.remove(tempPath).catch(()=>{});
      api.sendMessage(`❌ ${e.message}`, event.threadID);
      try { api.unsendMessage(wait.messageID); } catch(err){}
    }
  }
          }
