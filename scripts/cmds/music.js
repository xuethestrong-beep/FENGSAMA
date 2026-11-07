const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const youtubedl = require('youtube-dl-exec');

function jsonToNetscape(jsonStr) {
  try {
    const cookies = JSON.parse(jsonStr);
    let out = "# Netscape HTTP Cookie File\n";
    for (const c of cookies) {
      const domain = c.domain || ".youtube.com";
      const flag = domain.startsWith('.') ? "TRUE" : "FALSE";
      const p = c.path || "/";
      const sec = c.secure ? "TRUE" : "FALSE";
      const exp = c.expirationDate ? Math.round(c.expirationDate) : 0;
      out += `${domain}\t${flag}\t${p}\t${sec}\t${exp}\t${c.name}\t${c.value}\n`;
    }
    return out;
  } catch { return jsonStr; }
}

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
      if (process.env.YT_COOKIE) {
        let cc = process.env.YT_COOKIE.trim();
        if (cc.startsWith('[') || cc.startsWith('{')) cc = jsonToNetscape(cc);
        await fs.writeFile(cookiePath, cc);
      }
      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found");
      const video = search.videos[0];
      await youtubedl(video.url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0,
        output: filePath,
        noPlaylist: true,
        cookies: process.env.YT_COOKIE ? cookiePath : undefined,
      });
      await api.sendMessage({ body: `🎵 ${video.title}`, attachment: fs.createReadStream(filePath) }, event.threadID);
      await fs.remove(filePath);
      api.unsendMessage(wait.messageID);
    } catch (e) {
      console.log("[MUSIC V2]", e.message);
      await fs.remove(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message.slice(0,200)}`, event.threadID);
      try{ api.unsendMessage(wait.messageID); }catch{}
    }
  }
  }
