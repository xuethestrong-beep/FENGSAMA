const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "doujin",
    aliases: ["nh", "nhentai"],
    version: "1.1-NSFW",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} 123456 | {pn} random"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    
    let nsfwData = fs.readJsonSync(nsfwPath);
    
    if (!nsfwData[event.threadID]) {
      return message.reply("❌ NSFW is OFF in this group\n\nAsk admin to enable:\n!nsfw on");
    }

    let code = args[0]?.toLowerCase() || "random";
    let loading;
    try { loading = await api.sendMessage(`🔞 Loading doujin ${code}...`, event.threadID); } catch {}

    const cacheDir = path.join(__dirname, "cache");
    
    const send5 = async (urls) => {
      for (let i = 0; i < urls.length; i += 5) {
        let batch = urls.slice(i, i + 5);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `dj_${Date.now()}_${i}_${j}.jpg`);
            let r = await axios.get(batch[j], { responseType: "arraybuffer", timeout: 15000 });
            fs.writeFileSync(p, Buffer.from(r.data));
            atts.push(fs.createReadStream(p));
            paths.push(p);
          } catch {}
        }
        if (atts.length) {
          await message.reply({ attachment: atts });
          for (let pp of paths) if (fs.existsSync(pp)) fs.unlinkSync(pp);
          await new Promise(r => setTimeout(r, 800));
        }
      }
    };

    try {
      let id = code === "random" ? Math.floor(Math.random() * 400000) + 1 : parseInt(code) || Math.floor(Math.random() * 400000);
      
      let res = await axios.get(`https://nhentai.net/api/gallery/${id}`, { 
        timeout: 10000, 
        headers: { "User-Agent": "Mozilla/5.0" } 
      });

      let data = res.data;
      let title = data.title?.english || data.title?.pretty || `Doujin ${id}`;
      let tags = data.tags?.filter(t => t.type === "tag").slice(0,8).map(t => t.name).join(", ") || "N/A";
      let pages = data.num_pages;

      if (loading) api.unsendMessage(loading.messageID);
      await message.reply(`🔞 ${title}\n📄 ${pages} pages\n🏷️ ${tags}\n🆔 ${id}`);

      let mediaId = data.media_id;
      let extMap = { j: "jpg", p: "png", g: "gif", w: "webp" };
      let imageUrls = data.images.pages.map((p, i) => {
        let ext = extMap[p.t] || "jpg";
        return `https://i2.nhentai.net/galleries/${mediaId}/${i+1}.${ext}`;
      });

      await send5(imageUrls);
      return message.reply(`✅ Done! Next: !doujin ${id+1}`);

    } catch (e) {
      if (loading) try { api.unsendMessage(loading.messageID); } catch {}
      return message.reply(`❌ Code ${code} not found. Try !doujin random`);
    }
  }
};
