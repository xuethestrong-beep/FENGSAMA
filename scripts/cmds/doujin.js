const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "doujin",
    aliases: ["nh"],
    version: "5.2-FIXED-YOUR-CODE",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} 275224"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.readJsonSync(nsfwPath)[event.threadID]) return message.reply("❌ NSFW OFF\n!nsfw on");

    let id = parseInt(args[0]) || Math.floor(Math.random() * 300000) + 20000;

    const getJson = async (url) => {
      let proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      ];
      for (let p of proxies) {
        try {
          let { data } = await axios.get(p, { timeout: 20000 });
          let j = typeof data === "string" ? JSON.parse(data) : data;
          if (j && (j.id || j.media_id)) return j;
        } catch {}
      }
      return null;
    };

    let data = await getJson(`https://api.janda.sexy/nhentai/${id}`);
    if (!data) data = await getJson(`https://nhentai.net/api/gallery/${id}`);
    if (!data) return message.reply(`❌ ID ${id} not found`);

    let title = data.title?.english || data.title?.pretty || data.title || `Doujin ${id}`;
    let mediaId = data.media_id || data.media;
    let pages = data.images?.pages || data.pages || [];

    // FIX: janda returns images as array of URLs
    let isDirectUrls = data.images && Array.isArray(data.images) && typeof data.images[0] === "string";
    if (isDirectUrls) pages = data.images;

    await message.reply(`🔞 ${title}\n📄 ${pages.length} pages\n🆔 ${id}\n\n⏳ Sending...`);

    const cacheDir = path.join(__dirname, "cache");
    let extMap = { j: "jpg", p: "png", g: "gif", w: "webp" };

    for (let i = 0; i < pages.length; i += 2) {
      let batch = pages.slice(i, i + 2);
      let atts = [], paths = [];

      for (let j = 0; j < batch.length; j++) {
        let idx = i + j;
        let original;

        if (isDirectUrls) {
          original = batch[j];
        } else {
          let ext = extMap[batch[j].t] || "jpg";
          original = `https://i3.nhentai.net/galleries/${mediaId}/${idx+1}.${ext}`;
        }

        let imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(original.replace(/^https?:\/\//, ""))}`;

        try {
          let filePath = path.join(cacheDir, `dj_${Date.now()}_${idx}.jpg`);
          let res = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 25000, headers: { "User-Agent": "Mozilla/5.0" } });
          if (res.data.length < 5000) throw new Error("too small");
          fs.writeFileSync(filePath, Buffer.from(res.data));
          atts.push(fs.createReadStream(filePath));
          paths.push(filePath);
        } catch (e) {
          console.log(`Img ${idx+1} fail: ${e.message}`);
        }
      }

      if (atts.length > 0) {
        // FIX: use api.sendMessage not message.reply for attachment
        try {
          await api.sendMessage({ attachment: atts }, event.threadID);
        } catch (e) {
          console.log("Send fail:", e.message);
          await message.reply(`❌ FB blocked image ${i+1}-${i+atts.length} - file too large`);
        }
        for (let p of paths) if (fs.existsSync(p)) fs.unlinkSync(p);
        await new Promise(r => setTimeout(r, 1200));
      }
    }
    return message.reply(`✅ Done! !doujin ${id+1}`);
  }
};
