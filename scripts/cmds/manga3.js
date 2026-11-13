const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "manga3",
    version: "2.0",
    author: "Feng",
    role: 0,
    category: "anime"
  },
  onStart: async function({ api, event, args, message }) {
    let raw = args.join(" ").trim();
    if (!raw) return message.reply("Use: !manga3 solo leveling 1");

    let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
    let name = raw.replace(/\s*\d+\s*$/, "").trim();

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const send5 = async (urls) => {
      for (let i = 0; i < urls.length; i += 5) {
        let batch = urls.slice(i, i + 5);
        let atts = [], paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `m3_${Date.now()}_${i}_${j}.jpg`);
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
      let imageUrls = [];
      
      nhentai.jp.net/home

      if (!imageUrls.length) throw new Error("Add lini");
      await send5(imageUrls);
    } catch (e) {
      return message.reply(`❌ ${e.message}`);
    }
  }
};
