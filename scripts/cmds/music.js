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
      const p = c.path || "/"; const sec = c.secure ? "TRUE" : "FALSE";
      const exp = c.expirationDate ? Math.round(c.expirationDate) : 0;
      if (!c.name) continue;
      out += `${domain}\t${flag}\t${p}\t${sec}\t${exp}\t${c.name}\t${c.value}\n`;
    }
    return out;
  } catch { return jsonStr; }
}

module.exports = {
  name: "music",
  config: { name: "music" },
  async execute({ api, event, args, reply }) {
    const sendReply = reply || ((t, a) => a ? api.sendMessage({ body: t, attachment: a }, event.threadID, event.messageID) : api.sendMessage(t, event.threadID, event.messageID));
    if (!args[0]) return sendReply("Usage: !music <song name>");
    const query = args.join(" ");
    let waitID = null;
    try { const w = await api.sendMessage(`🎧 FENG searching: ${query}`, event.threadID, event.messageID); waitID = w.messageID; } catch(e){}
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, 'cookies.txt');
    try {
      if (process.env.YT_COOKIE) {
        let cc = process.env.YT_COOKIE.trim();
        if (cc.startsWith('[')) cc = jsonToNetscape(cc);
        await fs.writeFile(cookiePath, cc);
      }
      const search = await yts(query);
      if (!search.videos.length) throw new Error("Not found");
      const video = search.videos.find(v => v.seconds < 600) || search.videos[0];
      if (video.seconds > 600) throw new Error("Song too long (>10min)");
      await youtubedl(video.url, {
        extractAudio: true, audioFormat: 'mp3', audioQuality: 5,
        output: filePath, noPlaylist: true, maxFilesize: '24M',
        cookies: process.env.YT_COOKIE && fs.existsSync(cookiePath) ? cookiePath : undefined,
        noWarnings: true
      });
      const stat = await fs.stat(filePath);
      if (stat.size > 24*1024*1024) throw new Error("File too large (>24MB)");
      await api.sendMessage({ body: `🎵 ${video.title}\n⏱️ ${video.timestamp}`, attachment: fs.createReadStream(filePath) }, event.threadID, event.messageID);
    } catch (e) {
      console.log("[MUSIC]", e.message);
      sendReply(`❌ ${e.message.slice(0,200)}`);
    } finally {
      await fs.remove(filePath).catch(()=>{});
      if (waitID) try { api.unsendMessage(waitID); } catch {}
      if (global.gc) global.gc();
    }
  }
                                 }
