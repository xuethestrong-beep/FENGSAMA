const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "doujin",
    aliases: ["nh"],
    version: "6.0-RAILWAY-FINAL",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} 228922"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.readJsonSync(nsfwPath)[event.threadID]) return message.reply("❌ NSFW OFF\n!nsfw on");

    let id = parseInt(args[0]) || Math.floor(Math.random() * 300000) + 10000;

    try {
      await message.reply(`🔞 Loading ${id}...`);
      
      // Vercel mirror - NOT blocked by Railway
      let data = null;
      try {
        let r = await axios.get(`https://nhentai-api-3a1t.vercel.app/api/gallery/${id}`, { timeout: 15000 });
        if (r.data && r.data.id) data = r.data;
      } catch {}

      if (!data) {
        // Direct janda - no proxy, Railway allows it sometimes
        try {
          let r = await axios.get(`https://api.janda.sexy/nhentai/${id}`, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
          if (r.data && r.data.id) data = r.data;
        } catch {}
      }

      if (!data) return message.reply(`❌ ID ${id} not found on any mirror.\nTry: !doujin 1 or !doujin 228922\nRailway is blocking the API.`);

      let title = data.title?.english || data.title?.pretty || data.title || `Doujin ${id}`;
      let pages = data.images?.pages || [];
      let mediaId = data.media_id;

      await message.reply(`🔞 ${title}\n📄 ${pages.length} pages\n🆔 ${id}\n\n⏳ Sending images...`);

      const cacheDir = path.join(__dirname, "cache");
      let extMap = { j: "jpg", p: "png", g: "gif", w: "webp" };

      for (let i = 0; i < pages.length; i += 2) {
        let batch = pages.slice(i, i + 2);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          let idx = i + j;
          let ext = extMap[batch[j].t] || "jpg";
          let original = `https://i3.nhentai.net/galleries/${mediaId}/${idx+1}.${ext}`;
          let imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(original.replace(/^https?:\/\//, ""))}`;

          try {
            let filePath = path.join(cacheDir, `dj_${Date.now()}_${idx}.jpg`);
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
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      return api.sendMessage(`✅ Done! !doujin ${id+1}`, event.threadID);

    } catch (e) {
      console.log(e);
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
