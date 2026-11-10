const fs = require("fs-extra");
const path = require("path");
const play = require("play-dl");

module.exports = {
  config: { name: "music", aliases: ["song","play"], version: "5.7-fixed", author: "FENG", role: 0, countDown: 15, category: "media", guide: "{pn} <song>" },
  onStart: async function ({ api, event, args }) {
    const tid = event.threadID;
    if (!args.length) return api.sendMessage("❌ Ex: music Arthur Nery", tid);
    const query = args.join(" ").slice(0,200);
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `yt_${Date.now()}.mp3`);
    let searching=null;
    try{
      await fs.ensureDir(cacheDir);
      searching = await new Promise(r=>api.sendMessage(`🔍 Searching: ${query}`, tid, (e,i)=>r(i)));

      let cookieHeader = process.env.YT_COOKIE || process.env.YT_COOKIES || process.env.COOKIE || "";
      cookieHeader = cookieHeader.replace(/\\n/g, "\n");
      if (cookieHeader.includes("\t")) {
        cookieHeader = cookieHeader.split("\n").filter(l=>l.trim()&&!l.startsWith("#")).map(l=>{const p=l.split("\t"); return p[5]&&p[6]?`${p[5].trim()}=${p[6].trim()}`:null;}).filter(Boolean).join("; ");
      }
      
      if (!cookieHeader) throw new Error("YT_COOKIE not found");
      await play.setToken({ youtube: { cookie: cookieHeader } }).catch(()=>{});

      // FIX: use play-dl search not yts (yts is blocked on Railway)
      const searched = await play.search(query, { limit: 1, source: { youtube: "video" } });
      if (!searched?.length) throw new Error("No results - try other keyword");
      const video = searched[0];
      if (video.durationInSec > 600) throw new Error("Max 10min");

      const info = await play.video_info(video.url);
      const stream = await play.stream_from_info(info);
      
      await new Promise((res,rej)=>{
        const ws = fs.createWriteStream(filePath);
        stream.stream.pipe(ws);
        ws.on("finish", res); 
        ws.on("error", rej);
        setTimeout(()=>rej(new Error("Timeout")), 90000);
      });

      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(()=>{});
      await api.sendMessage({ body:`🎵 ${video.title}`, attachment: fs.createReadStream(filePath) }, tid, ()=>fs.unlink(filePath).catch(()=>{}));
    }catch(e){
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(()=>{});
      await fs.unlink(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message}`, tid);
      console.error("[MUSIC]", e);
    }
  }
};
