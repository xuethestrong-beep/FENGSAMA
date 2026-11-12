const fs = require("fs-extra");
const path = require("path");
const ytdlp = require("yt-dlp-exec");
const { randomUUID } = require("crypto");
const MAX_DURATION = 600;
const MAX_SIZE = 25 * 1024 * 1024;
const RAW_PROXY = (process.env.PROXY_URL || "").trim().replace(/^["']|["']$/g, "");
const PROXY = /^((https?|socks5h?|socks4):\/\/\S+)$/i.test(RAW_PROXY) && RAW_PROXY !== "null" && RAW_PROXY !== "undefined" ? RAW_PROXY : null;
delete process.env.HTTP_PROXY;
delete process.env.http_proxy;
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${label} timeout`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
async function safeUnsend(api, id) {
  if (!id) return;
  try { await api.unsendMessage(id); } catch {}
}
function sanitize(msg) {
  let m = String(msg || "");
  if (PROXY) m = m.split(PROXY).join("[proxy]");
  m = m.replace(/https?:\/\/[^\s"']*:[^\s"']*@[^\s"']+/g, "[proxy]");
  return m;
}
async function runMusic({ api, event, args, message }) {
  const query = args.join(" ").trim();
  if (!query) return message.reply("Use: !music <song name>");
  if (query.length > 200) return message.reply("Query too long");
  const filePath = path.join(__dirname, "cache", `${Date.now()}_${randomUUID().slice(0, 6)}.mp3`);
  try { fs.ensureDirSync(path.join(__dirname, "cache")); } catch {}
  let tmpMsg = null;
  try {
    const s = await api.sendMessage(`🔍 Searching: ${query}${PROXY ? " [proxy]" : ""}...`, event.threadID);
    tmpMsg = s?.messageID || null;
  } catch {}
  try {
    const searchOpts = { dumpSingleJson: true, noPlaylist: true, skipDownload: true, quiet: true, noWarnings: true, noCheckCertificates: true, addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"], ...(PROXY ? { proxy: PROXY } : {}) };
    const info = await withTimeout(ytdlp(`ytsearch1:${query}`, searchOpts), 25000, "Search");
    const video = info?.entries?.[0] || info;
    if (!video?.id) throw new Error("No results");
    const duration = video.duration || 0;
    if (duration > MAX_DURATION) throw new Error(`Video too long: ${Math.floor(duration / 60)}m (max 10m)`);
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    const title = video.title || query;
    const uploader = video.uploader || video.channel || "Unknown";
    const dlOpts = { extractAudio: true, audioFormat: "mp3", audioQuality: 0, output: filePath, noPlaylist: true, maxFilesize: "25M", quiet: true, noWarnings: true, noCheckCertificates: true, addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"], ...(PROXY ? { proxy: PROXY } : {}) };
    console.log("[MUSIC] DL:", title, "proxy:", !!PROXY);
    await withTimeout(ytdlp(url, dlOpts), 90000, "Download");
    const stat = await fs.stat(filePath);
    if (!stat.size || stat.size > MAX_SIZE) throw new Error("Audio >25MB or empty");
    await safeUnsend(api, tmpMsg);
    tmpMsg = null;
    await message.reply({ body: `🎵 ${title}\n👤 ${uploader}`, attachment: fs.createReadStream(filePath) });
  } catch (e) {
    const msg = sanitize(e?.message || e);
    console.log("MUSIC ERROR:", msg);
    await safeUnsend(api, tmpMsg);
    let userMsg = "⚠️ Music failed, please try again later.";
    if (msg.includes("No results")) userMsg = "❌ No results found.";
    else if (msg.includes("too long")) userMsg = `❌ ${msg}`;
    else if (msg.includes(">25MB") || msg.includes("empty")) userMsg = "❌ Audio too large (>25MB), try shorter.";
    else if (msg.includes("timeout")) userMsg = "⏳ YouTube timed out, try again.";
    else if (msg.includes("403") || msg.includes("Sign in") || msg.includes("bot")) userMsg = "⚠️ YouTube blocked (403), proxy may be dead. Try again.";
    else if (msg.includes("opts.agent") || msg.includes("opts.client")) userMsg = "⚠️ Node/fetch proxy conflict. Set only PROXY_URL, unset HTTP_PROXY/HTTPS_PROXY in Railway.";
    else userMsg = `❌ ${msg.slice(0, 200)}`;
    return message.reply(userMsg);
  } finally {
    try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch {}
  }
}
module.exports = { config: { name: "music", aliases: ["song", "play"], version: "6.4-ytdlp-proxy-fixed", author: "Feng - Fixed", role: 0, countDown: 10, category: "music" }, onStart: runMusic, ST: runMusic };
