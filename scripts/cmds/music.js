const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");
const play = require("play-dl");

module.exports = {
  config: { name: "music", aliases: ["song","play"], version: "5.6-railway-cookie", author: "FENG", role: 0, countDown: 15, category: "media", guide: "{pn} <song>" },
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
      
      // READ FROM RAILWAY VARIABLE
      let cookieHeader = process.env.YT_COOKIE || process.env.YT_COOKIES || process.env.COOKIE || "";
      
      // If variable is file path, read it. If it's raw cookie string, use directly.
      if (cookieHeader && cookieHeader.length < 300 && cookieHeader.includes(".txt")) {
        try { 
          const raw = await fs.readFile(cookieHeader, "utf8");
          cookieHeader = raw.split("\n").filter(l=>l.trim()&&!l.startsWith("#")).map(l=>{const p=l.split("\t"); return p[5]&&p[6]?`${p[5].trim()}=${p[6].trim()}`:null;}).filter(Boolean).join("; ");
        } catch {}
      } else if (cookieHeader.includes("\t")) {
        // Netscape format pasted in variable
        cookieHeader = cookieHeader.split("\n").filter(l=>l.trim()&&!l.startsWith("#")).map(l=>{const p=l.split("\t"); return p[5]&&p[6]?`${p[5].trim()}=${p[6].trim()}`:null;}).filter(Boolean).join("; ");
      }
      
      console.log("[MUSIC] YT_COOKIE exists:", !!cookieHeader, "len:", cookieHeader.length);
      
      if (cookieHeader) {
        await play.setToken({ youtube: { cookie: cookieHeader } }).catch(e=>console.log("setToken fail", e.message));
      } else {
        throw new Error("YT_COOKIE not found in Railway Variables");
      }

      const search = await yts(query);
      if (!search.videos?.length) throw new Error("No results");
      const video = search.videos[0];
      if (video.duration.seconds > 600) throw new Error("Max 10min");

      const info = await play.video_info(video.url);
      const stream = await play.stream_from_info(info);
      
      await new Promise((res,rej)=>{
        const ws = fs.createWriteStream(filePath);
        stream.stream.pipe(ws);
        ws.on("finish", res); 
        ws.on("error", rej);
        setTimeout(()=>rej(new Error("Timeout 90s")), 90000);
      });

      const stat = await fs.stat(filePath);
      if (stat.size < 1000) throw new Error("Empty file");
      
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
