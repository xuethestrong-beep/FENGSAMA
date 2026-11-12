const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { HttpsProxyAgent } = require("https-proxy-agent");

const CACHE_DIR = path.join(__dirname, "cache");
const API_TIMEOUT = 60000;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

const RAW_PROXY = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTP_PRO || process.env.HTTPS_PROXY || null;
function fixProxyUrl(url) {
  if (!url) return null;
  try { url = url.trim().replace(/^["']|["']$/g, ""); return new URL(url).toString(); }
  catch { return url; }
}
const PROXY_URL = fixProxyUrl(RAW_PROXY);
let agent = undefined;
if (PROXY_URL) {
  try { agent = new HttpsProxyAgent(PROXY_URL); console.log("[MUSIC] Proxy enabled"); }
  catch (e) { console.log("[MUSIC] Proxy parse failed:", e.message); agent = undefined; }
}
const http = axios.create({
  timeout: API_TIMEOUT, maxRedirects: 5,
  headers: { "User-Agent": "Mozilla/5.0" },
  httpsAgent: agent, httpAgent: agent, proxy: false
});

async function safeUnsend(message, messageID) { if (!messageID) return; try { await message.unsend(messageID); } catch {} }
function removeFile(file) { if (!file) return; try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {} }
function getResponseData(r) {
  const d = r?.data; if (!d || typeof d !== "object") throw new Error("Invalid API response");
  if (d.success === false || d.status === "error") throw new Error(d.message || d.error || "API failed"); return d;
}
function selectAudioFormat(formats) {
  if (!Array.isArray(formats)) return null;
  const audios = formats.filter(f => f && f.url && (String(f.type||"").toLowerCase().includes("audio") || ["mp3","m4a","aac"].includes(String(f.ext||"").toLowerCase())));
  return audios.find(f => String(f.ext||"").toLowerCase() === "mp3") || audios[0] || null;
}
function validateURL(v) {
  if (!v || typeof v !== "string") throw new Error("No download URL");
  try { const u = new URL(v); if (!["http:","https:"].includes(u.protocol)) throw new Error("bad proto"); return v; }
  catch { throw new Error(`Invalid URL: ${String(v).slice(0,80)}`); }
}
async function getDownloadURL(stapi, videoURL) {
  const endpoint = `${stapi.baseURL}/st/ytviddl`;
  const first = await http.post(endpoint, { url: videoURL });
  const firstData = getResponseData(first);
  const formats = Array.isArray(firstData.formats) ? firstData.formats : [];
  const selected = selectAudioFormat(formats);
  const immediate = firstData.downloadUrl || firstData.download_url || firstData.url;
  if (immediate && formats.length === 0) return validateURL(immediate);
  if (!selected) throw new Error("No audio format");
  const second = await http.post(endpoint, { url: videoURL, formatUrl: selected.url });
  const secondData = getResponseData(second);
  return validateURL(secondData.downloadUrl || secondData.download_url || secondData.url);
}
async function downloadAudio(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `music_${Date.now()}_${Math.random().toString(36).slice(2,8)}.mp3`);
  try {
    const res = await http.get(url, { responseType: "arraybuffer", maxContentLength: MAX_AUDIO_SIZE, maxBodyLength: MAX_AUDIO_SIZE });
    const buf = Buffer.from(res.data);
    if (!buf.length) throw new Error("Empty file"); if (buf.length > MAX_AUDIO_SIZE) throw new Error(">25MB");
    if (String(res.headers["content-type"]||"").toLowerCase().includes("text/html")) throw new Error("Got HTML not audio");
    fs.writeFileSync(file, buf); return file;
  } catch (e) { removeFile(file); throw e; }
}
async function processSong({ message, video, stapi }) {
  let file; let procMsg;
  try {
    procMsg = await message.reply(`⬇️ Processing: ${video.title}`);
    const dlUrl = await getDownloadURL(stapi, video.url);
    file = await downloadAudio(dlUrl);
    await safeUnsend(message, procMsg?.messageID);
    await message.reply({ body: `🎶 ${video.title}\n👤 ${video.author?.name||"Unknown"}\n⏱ ${video.timestamp||"?" }`, attachment: fs.createReadStream(file) });
  } catch (err) {
    console.error("[MUSIC] Error:", err.message); await safeUnsend(message, procMsg?.messageID);
    await message.reply(`❌ Music error: ${err.message}`);
  } finally { removeFile(file); }
}

async function startFunction({ message, args, event }) {
  if (!args?.length) return message.reply("🎵 Usage: music <song> | music -s <song>");
  let showList = false; if (args[0] === "-s") { showList = true; args.shift(); }
  const query = args.join(" ").trim(); if (!query) return message.reply("❌ Enter song name");
  let processing;
  try {
    processing = await message.reply(`🔍 Searching "${query}"...`);
    const search = await yts(query); const videos = search?.videos || [];
    if (!videos.length) { await safeUnsend(message, processing?.messageID); return message.reply("❌ No results"); }
    if (!showList) { await safeUnsend(message, processing?.messageID); const stapi = new global.utils.STBotApis(); return processSong({ message, video: videos[0], stapi }); }
    const top = videos.slice(0,6); let out = `🔍 Results for "${query}"\n\n`;
    top.forEach((v,i)=>{ out += `${i+1}. ${v.title}\n👤 ${v.author?.name||"Unknown"}\n⏱ ${v.timestamp||"?"}\n\n`; });
    out += `👉 Reply 1-${top.length}`;
    await safeUnsend(message, processing?.messageID);
    const info = await message.reply(out);
    if (info?.messageID && global.GoatBot?.onReply) global.GoatBot.onReply.set(info.messageID, { commandName: module.exports.config.name, author: event.senderID, videos: top });
  } catch (err) { console.error("[MUSIC] Search error:", err); await safeUnsend(message, processing?.messageID); return message.reply("❌ Search failed: " + (err.message||"unknown")); }
}

module.exports = {
  config: { name: "music", aliases: ["song"], version: "2.5.0-final-fixed", author: "ST Fixed", role: 0, category: "music" },
  onStart: startFunction,
  ST: startFunction,
  onReply: async function ({ message, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author)) return message.reply("⚠️ Not your request");
    const choice = parseInt(String(event.body||"").trim(),10);
    if (!Number.isInteger(choice) || choice<1 || choice>Reply.videos.length) return message.reply(`❌ Reply 1-${Reply.videos.length}`);
    try { const stapi = new global.utils.STBotApis(); return processSong({ message, video: Reply.videos[choice-1], stapi }); }
    catch (e) { return message.reply("❌ Failed: "+e.message); }
  }
};
