const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const play = require("play-dl");
const { randomUUID } = require("crypto");

const PROXY = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTP_PRO || process.env.HTTPS_PROXY;
console.log("MUSIC: Proxy found?", !!PROXY);

if(PROXY){
  // play-dl supports proxy via token
  try{
    play.setToken({ proxy: PROXY });
    // also for cookie if you have
    if(process.env.YT_COOKIE){
      let cookieStr = process.env.YT_COOKIE;
      try{ 
        const arr = JSON.parse(cookieStr);
        if(Array.isArray(arr)) cookieStr = arr.map(c=>`${c.name}=${c.value}`).join("; ");
      }catch{}
      play.setToken({ cookie: cookieStr, proxy: PROXY });
    }
  }catch(e){ console.log("Proxy set error:", e.message) }
}

module.exports = {
  config: { name: "music", aliases: ["song","play"], version: "6.4-PROXY", author: "Feng", role: 0, category: "music" },
  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("Use: !music <song>");
    if(!PROXY) return message.reply("⚠️ PROXY_URL not found in Railway Variables");

    const filePath = path.join(__dirname, "cache", `${Date.now()}_${randomUUID().slice(0,6)}.mp3`);
    fs.ensureDirSync(path.join(__dirname, "cache"));
    let tmp = null;
    try{ tmp = (await api.sendMessage(`🔍 Searching via proxy...`, event.threadID))?.messageID }catch{}

    try{
      const search = await yts(query);
      const video = search.videos[0];
      if(!video) throw new Error("No results");
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      console.log("MUSIC: Downloading", url, "via proxy");

      const info = await play.video_info(url);
      const streamInfo = await play.stream_from_info(info);
      
      await new Promise((res,rej)=>{
        const w = fs.createWriteStream(filePath);
        let bytes=0;
        streamInfo.stream.on("data",c=>{ bytes+=c.length; if(bytes>25*1024*1024) rej(new Error(">25MB")) });
        streamInfo.stream.pipe(w);
        w.on("finish",res).on("error",rej);
        streamInfo.stream.on("error",rej);
      });

      try{ if(tmp) await api.unsendMessage(tmp) }catch{}
      await message.reply({ 
        body:`🎵 ${video.title}\n👤 ${video.author.name}`, 
        attachment: fs.createReadStream(filePath) 
      },()=>{ try{fs.unlinkSync(filePath)}catch{} });

    }catch(e){
      console.log("MUSIC ERROR:", e);
      try{ if(tmp) await api.unsendMessage(tmp) }catch{}
      try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath) }catch{}
      return message.reply(`⚠️ Failed: ${e.message}. If 403, proxy may be dead - check if 38.154.185.97:6370 still active.`);
    }
  }
};
