const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: "doujin",
    aliases: ["nh", "nhentai"],
    version: "3.0-TO-BYPASS",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} 397378 | {pn} random"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    let nsfwData = fs.readJsonSync(nsfwPath);
    if (!nsfwData[event.threadID]) return message.reply("❌ NSFW OFF\nAdmin: !nsfw on");

    let input = (args[0] || "random").toLowerCase();
    let id = input === "random" ? Math.floor(Math.random() * 400000) + 10000 : parseInt(input);
    if (isNaN(id)) id = Math.floor(Math.random() * 400000) + 10000;

    let loading;
    try { loading = await api.sendMessage(`🔞 Loading ${id}...`, event.threadID); } catch {}

    const getHtml = async (url) => {
      for (let proxy of [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url
      ]) {
        try {
          let { data } = await axios.get(proxy, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
          let html = typeof data === "string" ? data : data.contents || "";
          if (html && html.length > 1000 && html.includes("nhentai")) return html;
        } catch {}
      }
      return null;
    };

    try {
      // Try nhentai.to scrape (no cloudflare)
      let html = await getHtml(`https://nhentai.to/g/${id}/`);
      if (!html) html = await getHtml(`https://nhentai.net/g/${id}/`);

      if (!html) throw new Error("All proxies blocked");

      const $ = cheerio.load(html);
      let title = $("h1.title, #info h1, .title").first().text().trim() || `Doujin ${id}`;
      let pages = $(".pages, #info .tags .tag").text().match(/(\d+)\s*pages/i);
      let numPages = pages ? pages[1] : $("img.lazyload, .thumb-container img").length || 0;

      // Get image list from script tag
      let imageUrls = [];
      $("script").each((i, el) => {
        let t = $(el).html();
        if (t && t.includes("gallery") && t.includes("media_id")) {
          try {
            let m = t.match(/"media_id":\s*"?(\d+)"?/);
            let p = t.match(/"pages":\s*(\[.*?\])/s) || t.match(/"num_pages":\s*(\d+)/);
            if (m) {
              let mediaId = m[1];
              let count = parseInt(t.match(/"num_pages":\s*(\d+)/)?.[1] || 20);
              for (let j = 1; j <= count; j++) {
                imageUrls.push(`https://i.nhentai.net/galleries/${mediaId}/${j}.jpg`);
              }
            }
          } catch {}
        }
      });

      // Fallback: extract thumbs
      if (imageUrls.length === 0) {
        $(".thumb-container img, #thumbnail-container img, .gallerythumb img").each((i, el) => {
          let src = $(el).attr("data-src") || $(el).attr("src");
          if (src) {
            let full = src.replace(/t\.nhentai\.net\/galleries\/\d+\/thumb/, `i.nhentai.net/galleries/${src.match(/galleries\/(\d+)/)?.[1] || ""}`).replace(/thumb\.jpg/, `${i+1}.jpg`).replace(/\.webp/, ".jpg");
            if (full.includes("i.nhentai")) imageUrls.push(full);
          }
        });
      }

      // Final fallback: use direct i server guess
      if (imageUrls.length === 0) {
        throw new Error("No images found - gallery maybe deleted");
      }

      if (loading) api.unsendMessage(loading.messageID);
      await message.reply(`🔞 ${title}\n📄 ${imageUrls.length} pages\n🆔 ${id}`);

      const cacheDir = path.join(__dirname, "cache");
      for (let i = 0; i < imageUrls.length; i += 5) {
        let batch = imageUrls.slice(i, i + 5);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `dj_${Date.now()}_${i}_${j}.jpg`);
            let r = await axios.get(batch[j], { responseType: "arraybuffer", timeout: 15000, headers: { Referer: "https://nhentai.to/" } });
            fs.writeFileSync(p, Buffer.from(r.data));
            atts.push(fs.createReadStream(p));
            paths.push(p);
          } catch {
            try {
              // Try i2 server
              let alt = batch[j].replace("i.nhentai", "i2.nhentai");
              let p = path.join(cacheDir, `dj_${Date.now()}_${i}_${j}_2.jpg`);
              let r = await axios.get(alt, { responseType: "arraybuffer", timeout: 15000 });
              fs.writeFileSync(p, Buffer.from(r.data));
              atts.push(fs.createReadStream(p));
              paths.push(p);
            } catch {}
          }
        }
        if (atts.length) {
          await message.reply({ attachment: atts });
          for (let pp of paths) if (fs.existsSync(pp)) fs.unlinkSync(pp);
          await new Promise(r => setTimeout(r, 800));
        }
      }
      return message.reply(`✅ Done! !doujin ${id+1}`);

    } catch (e) {
      if (loading) try { api.unsendMessage(loading.messageID); } catch {}
      console.log(e);
      return message.reply(`❌ Failed ID ${id}: ${e.message}\n\nYour host is blocking nhentai. Try:\n1. Use VPS not Render/Railway\n2. Or I can make alternative using Hentai2Read API`);
    }
  }
};
