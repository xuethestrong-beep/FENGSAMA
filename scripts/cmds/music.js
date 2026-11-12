const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const checkCooldown = require("./utils/mediaCooldown");

const CACHE_DIR = path.join(__dirname, "cache");
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const API_TIMEOUT = 60000;

const http = axios.create({
  timeout: API_TIMEOUT,
  maxRedirects: 5,
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0" }
});

async function safeUnsend(api, messageID) {
  if (!messageID) return;
  try {
    await api.unsendMessage(messageID);
  } catch {}
}

function removeFile(file) {
  try {
    if (file && fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) {
    console.error("[MUSIC] cleanup error:", e.message);
  }
}

function getResponseData(res) {
  const data = res?.data;
  if (!data || typeof data !== "object") throw new Error("Invalid response from music API.");
  if (data.success === false || data.status === "error") {
    throw new Error(data.message || data.error || "Music API failed");
  }
  return data;
}

function selectAudioFormat(formats) {
  if (!Array.isArray(formats)) return null;
  const audios = formats.filter(f => f?.url && (
    String(f.type).toLowerCase().includes("audio") ||
    ["mp3","m4a","aac","opus","ogg"].includes(String(f.ext).toLowerCase()) ||
    String(f.mimeType).toLowerCase().startsWith("audio/")
  ));
  return audios.find(f => f.ext === "mp3") || audios[0] || null;
}

function validateURL(value) {
  if (typeof value !== "string") throw new Error("API did not provide a download URL.");
  const u = new URL(value);
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Unsupported protocol");
  return value;
}

async function getDownloadURL(stapi, videoURL) {
  const endpoint = `${stapi.baseURL}/st/ytviddl`;
  const { data: firstDataRaw } = await http.post(endpoint, { url: videoURL });
  const firstData = getResponseData({ data: firstDataRaw });
  
  const immediate = firstData.downloadUrl || firstData.download_url || firstData.url;
  if (immediate && (!firstData.formats || firstData.formats.length === 0)) {
    return validateURL(immediate);
  }

  const selected = selectAudioFormat(firstData.formats);
  if (!selected) throw new Error("No supported audio format found.");

  const { data: secondDataRaw } = await http.post(endpoint, { url: videoURL, formatUrl: selected.url });
  const secondData = getResponseData({ data: secondDataRaw });
  return validateURL(secondData.downloadUrl || secondData.download_url || secondData.url);
}

async function downloadAudio(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `music_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`);
  
  const writer = fs.createWriteStream(file);
  const res = await http.get(url, { responseType: "stream" });

  const cType = String(res.headers["content-type"] || "").toLowerCase();
  if (cType.includes("text/html") || cType.includes("application/json")) {
    throw new Error("Download URL returned a webpage, not audio.");
  }

  const length = Number(res.headers["content-length"] || 0);
  if (length > MAX_AUDIO_SIZE) throw new Error("Audio exceeds 25MB limit.");

  let downloaded = 0;
  return new Promise((resolve, reject) => {
    res.data.on("data", chunk => {
      downloaded += chunk.length;
      if (downloaded > MAX_AUDIO_SIZE) {
        res.data.destroy();
        writer.destroy();
        removeFile(file);
        reject(new Error("Audio exceeds 25MB limit during download."));
      }
    });
    res.data.pipe(writer);
    writer.on("finish", () => resolve(file));
    writer.on("error", (e) => { removeFile(file); reject(e); });
  });
}

async function processSong({ api, message, video, stapi, requestedBy }) {
  let file;
  let processingMsg;
  try {
    processingMsg = await message.reply(`⬇️ Processing: ${video.title}`);
    const dlUrl = await getDownloadURL(stapi, video.url);
    file = await downloadAudio(dlUrl);
    
    await safeUnsend(api, processingMsg?.messageID);

    await message.reply({
      body: `🎶 ${video.title}\n👤 ${requestedBy || video.author?.name || "Unknown"}\n⏱ ${video.timestamp || "Unknown"}`,
      attachment: fs.createReadStream(file)
    });
  } catch (err) {
    console.error("[MUSIC]", err);
    await safeUnsend(api, processingMsg?.messageID);
    const msg = err.code === "ECONNABORTED" ? "Request timed out."
      : err.response?.status === 429 ? "API is busy, try again later."
      : err.response?.status >= 500 ? "API server unavailable."
      : err.message;
    await message.reply(`❌ Music error: ${msg}`);
  } finally {
    if (file) setTimeout(() => removeFile(file), 2000);
  }
}

module.exports = {
  config: {
    name: "music",
    aliases: ["song","play"],
    version: "2.6.0",
    author: "ST | Sheikh Tamim",
    role: 0,
    category: "music"
  },
  ST: async function ({ message, args, event, api }) {
    if (!args.length) return message.reply("🎵 Usage: music <song name>\nSearch list: music -s <song name>");

    let showList = false;
    if (args[0] === "-s") { showList = true; args.shift(); }

    const query = args.join(" ").trim();
    if (!query) return message.reply("❌ Enter a song name.");

    try {
      const allowed = await checkCooldown("music", event.senderID, api, event.threadID);
      if (!allowed) return;
    } catch (e) { return message.reply("❌ Cooldown check failed."); }

    let processing;
    try {
      processing = await message.reply(`🔍 Searching "${query}"...`);
      const { videos } = await yts(query);
      if (!videos?.length) { await safeUnsend(api, processing?.messageID); return message.reply("❌ No results found."); }

      await safeUnsend(api, processing?.messageID);
      const stapi = new global.utils.STBotApis();

      if (!showList) return processSong({ api, message, video: videos[0], stapi });

      const top = videos.slice(0, 6);
      let out = `🔍 Results for "${query}"\n\n`;
      top.forEach((v, i) => out += `${i+1}. ${v.title}\n👤 ${v.author?.name}\n⏱ ${v.timestamp}\n\n`);
      out += `👉 Reply with 1-${top.length}`;

      const info = await message.reply(out);
      if (info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          videos: top
        });
      }
    } catch (err) {
      await safeUnsend(api, processing?.messageID);
      return message.reply(`❌ Search failed: ${err.message}`);
    }
  },
  onReply: async function ({ message, event, Reply, api, usersData }) {
    if (String(event.senderID) !== String(Reply.author)) return message.reply("⚠️ Not your request.");
    const choice = parseInt(event.body?.trim(), 10);
    if (!Number.isInteger(choice) || choice < 1 || choice > Reply.videos.length) {
      return message.reply(`❌ Invalid choice. Use 1-${Reply.videos.length}`);
    }
    let name = "Unknown";
    try { name = await usersData.getName(event.senderID); } catch {}
    const stapi = new global.utils.STBotApis();
    return processSong({ api, message, video: Reply.videos[choice-1], stapi, requestedBy: name });
  }
};
