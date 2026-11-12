const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: { name: "music", version: "3.3-DOWN-MSG", author: "Feng", role: 0, category: "music" },
  onStart: async function({ api, event, args }){
    let query = args.join(" ");
    if(!query) return api.sendMessage("Usage: !music <song>", event.threadID);
    
    let filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
    fs.ensureDirSync(path.join(__dirname, "cache"));
    let tmpMsg = null;

    try{
      let sent = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
      tmpMsg = sent.messageID;

      let search = await yts(query);
      if(!search.videos.length) throw new Error("No results");
      let video = search.videos[0];
      let url = `https://www.youtube.com/watch?v=${video.videoId}`;

      let cookie = process.env.YT_COOKIE || "";
      if(!cookie) throw new Error("No cookie");
      
      let agent;
      try{ if(cookie.trim().startsWith("[")) agent = ytdl.createAgent(JSON.parse(cookie)); }catch{}

      let opts = { 
        filter: "audioonly", 
        quality: "highestaudio",
        requestOptions: { headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" } } 
      };
      if(agent) opts.agent = agent;

      const stream = ytdl(url, opts);
      await new Promise((res, rej)=>{
        let w = fs.createWriteStream(filePath);
        stream.pipe(w);
        w.on("finish", res);
        w.on("error", rej);
        stream.on("error", rej);
      });

      if(tmpMsg) api.unsendMessage(tmpMsg);

      await api.sendMessage({ 
        attachment: fs.createReadStream(filePath) 
      }, event.threadID, ()=>{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); });

    }catch(e){
      if(tmpMsg) api.unsendMessage(tmpMsg);
      if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return api.sendMessage("⚠️ This command is currently down at the moment. Please try again later.", event.threadID);
    }
  }
};
