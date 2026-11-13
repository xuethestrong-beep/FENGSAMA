const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: "hfox",
    aliases: ["hentaifox", "hf"],
    version: "2.0-RAILWAY",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} 12345 | {pn} random"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.readJsonSync(nsfwPath)[event.threadID]) return message.reply("❌ NSFW OFF\n!nsfw on");

    let id = args[0] || Math.floor(Math.random() * 80000) + 1000;

    try {
      await message.reply(`🦊 HentaiFox loading ${id}...`);
      
      // hentaifox API - never blocked on Railway
      let { data } = await axios.get(`https://hentaifox.com/g/${id}/`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      }).catch(async () => {
        // fallback to API
        return await axios.get(`https://api.hentaifox.com/gallery/${id}`, { timeout: 15000 });
      });

      let $ = cheerio.load(data);
      let title = $("h1").first().text().trim() || `HentaiFox ${id}`;
      let images = [];
      
      // get from html
      $(".gallery img, .thumb img, #gallery img").each((i, el) => {
        let src = $(el).attr("src") || $(el).attr("data-src");
        if (src && src.includes("hentaifox")) {
          if (src.startsWith("//")) src = "https:" + src;
          images.push(src);
        }
      });

      if (images.length === 0) {
        // try API structure
        if (data.images) images = data.images;
        else if (data.pages) images = data.pages.map(p => `https://i.hentaifox.com/${id}/${p}`);
      }

      if (images.length === 0) return message.reply(`❌ ID ${id} not found\nTry: !hfox random`);

      images = [...new Set(images)].slice(0, 25);
      await message.reply(`📖 ${title}\n📄 ${images.length} pages\n🆔 ${id}`);

      const cacheDir = path.join(__dirname, "cache");
      for (let i = 0; i < images.length; i += 2) {
        let batch = images.slice(i, i + 2);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(batch[j].replace(/^https?:\/\//, ""))}`;
            let filePath = path.join(cacheDir, `hf_${Date.now()}_${i}_${j}.jpg`);
            let res = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 20000 });
            if (res.data.length < 5000) continue;
            fs.writeFileSync(filePath, Buffer.from(res.data));
            atts.push(fs.createReadStream(filePath));
            paths.push(filePath);
          } catch {}
        }
        if (atts.length > 0) {
          await api.sendMessage({ attachment: atts }, event.threadID);
          for (let p of paths) if (fs.existsSync(p)) fs.unlinkSync(p);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      return api.sendMessage(`✅ Done! !hfox ${parseInt(id)+1}`, event.threadID);
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}\nTry !hfox 1`);
    }
  }
};
