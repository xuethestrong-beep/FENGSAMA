const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "music",
    aliases: ["song","yt","play"],
    version: "4.0-ytsearch",
    author: "FENG",
    role: 0,
    shortDescription: "YouTube music search",
    longDescription: "Search YouTube and download mp3",
    category: "media",
    guide: "{pn} <song name> - e.g. {pn} pagsamo"
  },

  onStart: async function({ api, event, args }) {
    if (!args.length) return api.sendMessage("❌ Provide song name. Ex: !music pagsamo", event.threadID);

    const query = args.join(" ");
    const tid = event.threadID;
    const msgID = event.messageID;

    const searching = await new Promise(res => {
      api.sendMessage(`🔍 Searching YouTube for: "${query}"...`, tid, (err, info) => res(info), msgID);
    });

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const outputFile = path.join(cacheDir, `music_${Date.now()}.mp3`);
    const cookiePath = path.join(cacheDir, "cookies.txt");

    try {
      // Build yt-dlp args with ytsearch
      const ytArgs = [
        `ytsearch1:${query}`,
        "-x", "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--max-filesize", "25M",
        "-o", outputFile,
        "--no-warnings",
        "--force-overwrites"
      ];

      // Use cookies if exists to avoid bot check
      if (await fs.pathExists(cookiePath)) {
        ytArgs.push("--cookies", cookiePath);
      }

      await new Promise((resolve, reject) => {
        const ytdlp = spawn("yt-dlp", ytArgs);
        let stderr = "";
        ytdlp.stderr.on("data", d => stderr += d.toString());
        ytdlp.on("close", code => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `yt-dlp exit ${code}`));
        });
        ytdlp.on("error", err => reject(err));
      });

      // Check file exists and not too big
      if (!(await fs.pathExists(outputFile))) throw new Error("Download failed");
      const stat = await fs.stat(outputFile);
      if (stat.size === 0) throw new Error("File empty");
      if (stat.size > 26 * 1024 * 1024) {
        await fs.unlink(outputFile).catch(()=>{});
        throw new Error("File too large >25MB");
      }

      // Get title for message
      let title = query;
      try {
        const infoArgs = [`ytsearch1:${query}`, "--get-title", "--no-playlist"];
        if (await fs.pathExists(cookiePath)) infoArgs.push("--cookies", cookiePath);
        const proc = spawn("yt-dlp", infoArgs);
        let out = "";
        proc.stdout.on("data", d => out += d.toString());
        await new Promise(r => proc.on("close", r));
        if (out.trim()) title = out.trim().split("\n")[0];
      } catch {}

      await api.unsendMessage(searching.messageID).catch(()=>{});
      await api.sendMessage({
        body: `🎵 ${title}`,
        attachment: fs.createReadStream(outputFile)
      }, tid, async () => {
        await fs.unlink(outputFile).catch(()=>{});
      }, msgID);

    } catch (e) {
      console.error("[music]", e.message);
      await fs.unlink(outputFile).catch(()=>{});
      await api.unsendMessage(searching.messageID).catch(()=>{});
      api.sendMessage(`❌ Failed: ${e.message}\nTry another keyword or add cookies.txt to cache folder`, tid, msgID);
    }
  }
};
