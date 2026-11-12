const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: {
    name: "music",
    version: "3.4-FIXED",
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
      let sent = await api.sendMessage(`🔍 Searching: ${query}...`, event.threadID);
      tmpMsg = sent.messageID;
    } catch {}

    try {
      // 1. Search
      let search = await yts(query);
      if (!search.videos.length) throw new Error("No results");
      let video = search.videos[0];
      let url = `https://www.youtube.com/watch?v=${video.videoId}`;

      // 2. Cookie
      let cookie = process.env.YT_COOKIE || "";
      if (!cookie) throw new Error("No cookie");
      
      let agent;
      try {
        if (cookie.trim().startsWith("[")) {
          agent = ytdl.createAgent(JSON.parse(cookie));
        }
      } catch {}

      // 3. Download
      let opts = {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
          headers: {
            Cookie: cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        }
      };
      if (agent) opts.agent = agent;

      const stream = ytdl(url, opts);
      await new Promise((resolve, reject) => {
        let write = fs.createWriteStream(filePath);
        stream.pipe(write);
        write.on("finish", resolve);
        write.on("error", reject);
        stream.on("error", reject);
      });

      // 4. Success - delete searching, reply with mp3 only
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
