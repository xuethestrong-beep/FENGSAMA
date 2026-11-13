const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "doujin",
    aliases: ["nh", "nhentai"],
    version: "2.0-FIXED",
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
      return message.reply("❌ NSFW is OFF\nAdmin: !nsfw on");
    }

    let input = (args[0] || "random").toLowerCase();
    let id = input === "random" || !input ? Math.floor(Math.random() * 450000) + 1 : parseInt(input);
    if (isNaN(id)) id = Math.floor(Math.random() * 450000) + 1;

    let loading;
    try { loading = await api.sendMessage(`🔞 Loading ${id}...`, event.threadID); } catch {}

    const cacheDir = path.join(__dirname, "cache");
    
    const send5 = async (urls) => {
      for (let i = 0; i < urls.length; i += 5) {
        let batch = urls.slice(i, i + 5);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `dj_${Date.now()}_${i}_${j}.jpg`);
            let r = await axios.get(batch[j], { responseType: "arraybuffer", timeout: 15000, headers: { "User-Agent": "Mozilla/5.0", Referer: "https://nhentai.net/" } });
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
      let data = null;
      
      // API 1: janda.sexy (most stable)
      try {
        let r = await axios.get(`https://api.janda.sexy/nhentai/${id}`, { timeout: 10000 });
        if (r.data && r.data.id) data = r.data;
      } catch {}

      // API 2: nhentai.net via allorigins proxy
      if (!data) {
        try {
          let proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://nhentai.net/api/gallery/${id}`)}`;
          let r = await axios.get(proxy, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
          let d = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          if (d && d.id) data = d;
        } catch {}
      }

      if (!data || !data.id) throw new Error("API down");

      let title = data.title?.english || data.title?.pretty || data.title || `Doujin ${id}`;
      let pages = data.num_pages || data.images?.pages?.length || 0;
      let tags = (data.tags?.filter ? data.tags.filter(t => t.type === "tag").slice(0,6).map(t => t.name).join(", ") : data.tags?.slice(0,6).join(", ")) || "N/A";

      if (loading) api.unsendMessage(loading.messageID);
      
      // Normalize to nhentai format if from janda
      let mediaId, pageList;
      if (data.media_id) {
        // Original nhentai format
        mediaId = data.media_id;
        pageList = data.images.pages;
      } else {
        // Janda format
        title = data.title || title;
        mediaId = data.media_id || data.media;
        pageList = data.images?.pages || [];
        // janda already has image URLs
        if (data.images && Array.isArray(data.images) && typeof data.images[0] === "string") {
          await message.reply(`🔞 ${title}\n📄 ${pages} pages\n🏷️ ${tags}\n🆔 ${id}`);
          await send5(data.images);
          return message.reply(`✅ Done! !doujin ${id+1}`);
        }
      }

      await message.reply(`🔞 ${title}\n📄 ${pages} pages\n🏷️ ${tags}\n🆔 ${id}`);

      let extMap = { j: "jpg", p: "png", g: "gif", w: "webp" };
      let imageUrls = pageList.map((p, i) => {
        let ext = extMap[p.t] || "jpg";
        return `https://i2.nhentai.net/galleries/${mediaId}/${i+1}.${ext}`;
      });

      // Try i1,i2,i3 servers
      if (imageUrls.length) {
        await send5(imageUrls);
      }

      return message.reply(`✅ Done! Next: !doujin ${id+1}`);

    } catch (e) {
      if (loading) try { api.unsendMessage(loading.messageID); } catch {}
      console.log(e);
      return message.reply(`❌ ID ${id} failed, trying random...\nError: ${e.message}\nTry again: !doujin random`);
    }
  }
};
