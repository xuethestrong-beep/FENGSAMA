const fs = require("fs-extra");
const path = require("path");
const play = require("play-dl");

function parseCookie(raw) {
  let s = String(raw || "").replace(/\\n/g, "\n").trim();
  if (!s) return "";
  if (s.includes("\t")) {
    s = s.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).map(l => {
      const p = l.split("\t");
      return p[5] && p[6] ? `${p[5].trim()}=${p[6].trim()}` : null;
    }).filter(Boolean).join("; ");
  }
  const keep = ["VISITOR_INFO1_LIVE", "YSC", "PREF", "SID", "HSID", "SSID", "APISID", "SAPISID", "__Secure-1PSID", "__Secure-3PSID", "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-1PSIDCC", "__Secure-3PSIDCC", "LOGIN_INFO"];
  const parts = s.split(";").map(c => c.trim()).filter(Boolean);
  const filtered = parts.filter(c => keep.some(k => c.startsWith(k + "=")));
  return (filtered.length ? filtered : parts).join("; ");
}

const YT_COOKIE = parseCookie(process.env.YT_COOKIE || process.env.YT_COOKIES || "");
if (YT_COOKIE) {
  play.setToken({ youtube: { cookie: YT_COOKIE } }).then(() => console.log("[MUSIC] cookie set, len:", YT_COOKIE.length)).catch((e) => console.error("[MUSIC] setToken failed:", e.message));
} else {
  console.warn("[MUSIC] no YT_COOKIE set, play-dl may get 403");
}

module.exports = {
  config: {
    name: "music",
    aliases: ["song", "play"],
    version: "6.1",
    author: "FENG",
    role: 0,
    countDown: 10,
    category: "media",
    description: "Search YouTube and send audio (play-dl + YT cookie, max 10 min)",
    guide: "{pn} <song>"
  },
  onStart: async function ({ api, event, args }) {
    const tid = event.threadID;
    const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
    if (!args.length) return api.sendMessage(`❌ Ex: ${prefix}music Arthur Nery`, tid);
    const query = args.join(" ").slice(0, 200);
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `yt_${Date.now()}_${Math.floor(Math.random() * 1e6)}.mp3`);
    let searching = null;
    const cleanup = async () => { await fs.unlink(filePath).catch(() => {}); };
    try {
      await fs.ensureDir(cacheDir);
      searching = await new Promise((res, rej) => api.sendMessage(`🔍 Searching: ${query}`, tid, (e, i) => e ? rej(e) : res(i))).catch(() => null);
      const searched = await Promise.race([
        play.search(query, { limit: 1, source: { youtube: "video" } }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Search timed out")), 15000))
      ]);
      if (!searched?.length) throw new Error("No results");
      const v = searched[0];
      if (v.type && v.type !== "video") throw new Error("No video result");
      if (!v.id) throw new Error("No video ID");
      if (v.isLive || !v.durationInSec || v.durationInSec > 600) throw new Error("Too long (max 10 min) / Live not supported");
      const videoUrl = v.url && String(v.url).startsWith("http") ? v.url : `https://www.youtube.com/watch?v=${v.id}`;
      const info = await Promise.race([
        play.video_info(videoUrl),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Video info timed out")), 15000))
      ]);
      const { stream: audioStream } = await play.stream_from_info(info);
      if (!audioStream) throw new Error("No audio stream");
      const write = fs.createWriteStream(filePath);
      await new Promise((res, rej) => {
        let done = false;
        const finish = (fn, val) => { if (done) return; done = true; clearTimeout(timer); fn(val); };
        const timer = setTimeout(() => { audioStream.destroy(); write.destroy(); finish(rej, new Error("Download timeout")); }, 90000);
        audioStream.on("error", (e) => finish(rej, e));
        write.on("error", (e) => finish(rej, e));
        write.on("finish", () => finish(res));
        audioStream.pipe(write);
      });
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || stat.size < 1000) throw new Error("Download failed (empty file).");
      if (stat.size > 25 * 1024 * 1024) throw new Error("Too big >25MB");
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(() => {});
      searching = null;
      await api.sendMessage({ body: `🎵 ${v.title || info.video_details?.title || "Unknown"}\n${videoUrl}`, attachment: fs.createReadStream(filePath) }, tid);
      setTimeout(() => cleanup(), 5000);
    } catch (e) {
      if (searching?.messageID) await api.unsendMessage(searching.messageID).catch(() => {});
      await cleanup();
      api.sendMessage(`❌ ${e.message}`, tid);
      console.error("[MUSIC]", e.message);
    }
  }
};
