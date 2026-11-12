const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: {
    name: "music",
    version: "5.0-FINAL",
    author: "Feng",
    role: 0,
    category: "music"
  },
  onStart: async function({ api, event, args, message }) {
    let query = args.join(" ");
    if (!query) return message.reply("Use: !music <song name>");
    
    let filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
    fs.ensureDirSync(path.join(__dirname, "cache"));
    
    let tmpMsg = null;
    try {
      let s = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
      tmpMsg = s.messageID;
    } catch {}

    try {
      let search = await yts(query);
      if (!search.videos.length) throw new Error("No results");
      let video = search.videos[0];
      let url = `https://www.youtube.com/watch?v=${video.videoId}`;

      let rawCookie = process.env.YT_COOKIE || "";
      if (!rawCookie) throw new Error("No YT_COOKIE env");

      let agent = null;
      let headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

      // Auto-detect cookie format
      if (rawCookie.trim().startsWith("[")) {
        // NEW format: JSON array
        agent = ytdl.createAgent(JSON.parse(rawCookie));
      } else {
        // OLD format: string
        headers.Cookie = rawCookie;
      }

      let options = {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: { headers }
      };
      if (agent) options.agent = agent;

      // Try with info first (more stable)
      let info = await ytdl.getInfo(url, options);
      let stream = ytdl.downloadFromInfo(info, options);

      await new Promise((resolve, reject) => {
        let write = fs.createWriteStream(filePath);
        stream.pipe(write);
        write.on("finish", resolve);
        write.on("error", reject);
        stream.on("error", reject);
      });

      if (tmpMsg) api.unsendMessage(tmpMsg);
      
      await message.reply({
        attachment: fs.createReadStream(filePath)
      }, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch (e) {
      console.log("MUSIC ERROR:", e.message);
      if (tmpMsg) api.unsendMessage(tmpMsg);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return message.reply("⚠️ This command is currently down at the moment. Please try again later.");
    }
  }
};
