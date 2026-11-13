const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "manhua",
    aliases: ["manhwa", "manwa", "manhua2"],
    version: "1.0",
    author: "Feng",
    role: 0,
    category: "anime",
    guide: "{pn} solo leveling 1"
  },
  onStart: async function({ api, event, args, message }) {
    if (!args[0]) return message.reply("Use: !manhua solo leveling 1");
    
    let raw = args.join(" ");
    let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
    let name = raw.replace(/\s*\d+\s*$/, "").trim().toLowerCase();

    let loading;
    try { loading = await api.sendMessage(`📚 Loading manhua ${name} Ch.${chap}...`, event.threadID); } catch {}

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const send5 = async (files, getUrl) => {
      for (let i = 0; i < files.length; i += 5) {
        let batch = files.slice(i, i + 5);
        let atts = []; let paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `mh_${Date.now()}_${i}_${j}.jpg`);
            let res = await axios.get(getUrl(batch[j]), { responseType: "arraybuffer", timeout: 15000, headers: { Referer: "https://manhuaplus.com/" } });
            fs.writeFileSync(p, Buffer.from(res.data));
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
      // Try ManhuaPlus API (best for manhua/manhwa)
      let slug = name.replace(/[^a-z0-9]+/g, "-");
      
      // Try comick.io with type manhua
      let s = await axios.get(`https://api.comick.io/v1.0/search?query=${encodeURIComponent(name)}&limit=5`, { timeout: 10000 });
      if (s.data.length) {
        let comic = s.data.find(c => c.md_covers) || s.data[0];
        let chs = await axios.get(`https://api.comick.io/comic/${comic.slug}/chapters?chap=${chap}&lang=en`, { timeout: 10000 });
        let list = chs.data.chapters || chs.data;
        let ch = Array.isArray(list) ? list.find(c => c.chap == chap) || list[0] : list;
        if (ch) {
          let imgs = await axios.get(`https://api.comick.io/chapter/${ch.hid}/get_images`, { timeout: 10000 });
          if (imgs.data.length) {
            if (loading) api.unsendMessage(loading.messageID);
            await message.reply(`📖 ${comic.title} Ch.${chap} - ${imgs.data.length} pages`);
            await send5(imgs.data, f => f.url);
            return message.reply(`✅ Done! Next: !manhua ${name} ${chap+1}`);
          }
        }
      }
      throw new Error("not found");
    } catch (e) {
      if (loading) try { api.unsendMessage(loading.messageID); } catch {}
      return message.reply(`❌ Can't find ${name} Ch.${chap}. Try !manga instead.`);
    }
  }
};
