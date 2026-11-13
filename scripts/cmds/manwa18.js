const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: "manwa18",
    aliases: ["manhwa18", "mh18"],
    version: "1.1-RAILWAY-FIXED",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} secret class | {pn} 123 | {pn} random"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.readJsonSync(nsfwPath)[event.threadID]) return message.reply("❌ NSFW OFF\nAdmin: !nsfw on");

    let query = args.join(" ").trim() || "random";

    const getHtml = async (url) => {
      for (let proxy of [
        url,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      ]) {
        try {
          let { data } = await axios.get(proxy, { timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
          let html = typeof data === "string" ? data : data.contents || "";
          if (html && html.length > 1000) return cheerio.load(html);
        } catch {}
      }
      return null;
    };

    try {
      await message.reply(`🔞 Searching Manhwa18: ${query}...`);

      let searchUrl = `https://manhwa18.cc/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
      if (query === "random" || /^\d+$/.test(query)) searchUrl = `https://manhwa18.cc/manga/?m_orderby=rand`;

      let $ = await getHtml(searchUrl);
      if (!$) return message.reply("❌ Manhwa18.cc is down or blocked on Railway");

      let firstLink = $(".c-tabs-item__content .tab-thumb a, .listupd a, .bsx a").first().attr("href");
      if (!firstLink) return message.reply(`❌ No result for "${query}"`);

      let $manga = await getHtml(firstLink);
      if (!$manga) return message.reply("❌ Failed to load manga page");

      let title = $manga("h1").first().text().trim() || "Manhwa18";
      let chapterLink = $manga(".wp-manga-chapter a, .chbox a, .listing li a").first().attr("href");
      if (!chapterLink) return message.reply(`📖 ${title}\n${firstLink}\n\nNo chapters found.`);

      await message.reply(`📖 ${title}\n📄 Reading latest chapter...\n${chapterLink}`);

      let $chap = await getHtml(chapterLink);
      if (!$chap) return message.reply("❌ Failed to load chapter");

      let images = [];
      $chap(".reader-area img, #reader img, .text-left img, .reading-content img, .reader img").each((i, el) => {
        let src = $chap(el).attr("src") || $chap(el).attr("data-src") || $chap(el).attr("data-lazy-src");
        if (src && src.includes("http") && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
          src = src.trim();
          if (src.startsWith("//")) src = "https:" + src;
          images.push(src);
        }
      });

      images = [...new Set(images)].slice(0, 20);

      if (images.length === 0) return message.reply(`📖 ${title}\nRead here: ${chapterLink}\n\nImages protected, open link.`);

      const cacheDir = path.join(__dirname, "cache");
      for (let i = 0; i < images.length; i += 3) {
        let batch = images.slice(i, i + 3);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(batch[j].replace(/^https?:\/\//, ""))}`;
            let filePath = path.join(cacheDir, `mh_${Date.now()}_${i}_${j}.jpg`);
            let res = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 20000, headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://manhwa18.cc/" } });
            if (res.data.length < 5000) continue;
            fs.writeFileSync(filePath, Buffer.from(res.data));
            atts.push(fs.createReadStream(filePath));
            paths.push(filePath);
          } catch {}
        }
        if (atts.length > 0) {
          await api.sendMessage({ attachment: atts }, event.threadID);
          for (let p of paths) if (fs.existsSync(p)) fs.unlinkSync(p);
          await new Promise(r => setTimeout(r, 1200));
        }
      }
      return api.sendMessage(`✅ Done! ${title}\n${chapterLink}`, event.threadID);

    } catch (e) {
      console.log(e);
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
