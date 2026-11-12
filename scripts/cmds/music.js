const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: {
    name: "music",
    version: "5.1-FINAL",
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

      let raw = process.env.YT_COOKIE;
      if (!raw) throw new Error("No YT_COOKIE env");

      // Supports NEW JSON cookie format
      let agent = ytdl.createAgent(JSON.parse(raw));

      let info = await ytdl.getInfo(url, { agent });
      let stream = ytdl.downloadFromInfo(info, { filter: "audioonly", quality: "highestaudio" });

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
