const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const play = require("play-dl");

module.exports = {
  config: {
    name: "music",
    aliases: ["song","play"],
    version: "5.3-bot-fix",
    author: "FENG",
    role: 0,
    countDown: 10,
    category: "media",
    guide: "{pn} <song>"
  },
  onStart: async function ({ api, event, args }) {
    const tid = event.threadID;
    if (!args.length) return api.sendMessage("❌ Ex: !music Arthur Nery", tid);
    const query = args.join(" ").slice(0,200);
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `yt_${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, "cookies.txt");
    let searching = null;
    try {
      await fs.ensureDir(cacheDir);
      searching = await new Promise(r => api.sendMessage(`🔍 Searching YT: ${query}`, tid, (e,i)=>r(i)));
      const search = await yts(query);
      if (!search.videos?.length) throw new Error("No results");
      const video = search.videos[0];
      if (video.duration.seconds > 600) throw new Error("Too long max 10min");

      // Try ytdl with cookies if exists
      let success = false;
      if (await fs.pathExists(cookiePath)) {
        try {
          const cookieData = await fs.readFile(cookiePath, "utf8");
          const agent = ytdl.createAgent(JSON.parse(await fs.readFile(path.join(cacheDir,"cookies.json")).catch(()=> "[]")).length ? undefined : cookieData.split("\n").filter(l=>l.trim()&&!l.startsWith("#")).map(l=>{const p=l.split("\t");return {name:p[5],value:p[6],domain:p[0]}}));
          const stream = ytdl(video.url, { filter:"audioonly", quality:"highestaudio" });
          await new Promise((res,rej)=>{ stream.pipe(fs.createWriteStream(filePath)).on("finish",res).on("error",rej); stream.on("error",rej); });
          success = true;
        } catch(e){ console.log("ytdl with cookie failed", e.message); }
      } else {
        try {
          const stream = ytdl(video.url, { filter:"audioonly", quality:"highestaudio" });
          await new Promise((res,rej)=>{ stream.pipe(fs.createWriteStream(filePath)).on("finish",res).on("error",rej); stream.on("error",rej); });
          success = true;
        } catch(e){ console.log("ytdl failed, trying play-dl", e.message); }
      }

      if (!success) {
        // Fallback to play-dl which bypasses bot better and you already have it in package.json
        const yt_info = await play.video_info(video.url);
        const stream = await play.stream_from_info(yt_info);
        await new Promise((res,rej)=>{
          const ws = fs.createWriteStream(filePath);
          stream.stream.pipe(ws);
          ws.on("finish",res); ws.on("error",rej);
        });
      }

      const stat = await fs.stat(filePath);
      if (stat.size > 25*1024*1024) throw new Error("Too big >25MB");
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(()=>{});
      await api.sendMessage({ body:`🎵 ${video.title}\n${video.url}`, attachment: fs.createReadStream(filePath) }, tid, ()=>fs.unlink(filePath).catch(()=>{}));
    } catch(e){
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(()=>{});
      await fs.unlink(filePath).catch(()=>{});
      api.sendMessage(`❌ ${e.message}\nIf 'Sign in to confirm you're not a bot' → add cookies.txt to scripts/cmds/cache/`, tid);
      console.error("[MUSIC]", e);
    }
  }
};
