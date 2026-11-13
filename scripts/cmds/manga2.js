const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "manga2",
    aliases: ["comics2", "manhwa2"],
    version: "6.1-SILENT-FIXED",
    author: "Feng",
    role: 0,
    category: "anime"
  },
  onStart: async function({ api, event, args, message }) {
    if (!args[0]) return message.reply("Use: !manga2 solo leveling 1");

    let raw = args.join(" ");
    let chapNum = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
    let name = raw.replace(/\s*\d+\s*$/, "").trim();

    let searching;
    try {
      searching = await api.sendMessage(`🔍 Searching ${name} Ch.${chapNum}...`, event.threadID);
    } catch {}

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const send5 = async (files, getUrl) => {
      for (let i = 0; i < files.length; i += 5) {
        let batch = files.slice(i, i + 5);
        let attachments = [];
        let paths = [];
        for (let j = 0; j < batch.length; j++) {
          try {
            let p = path.join(cacheDir, `mg_${Date.now()}_${i}_${j}.jpg`);
            let res = await axios.get(getUrl(batch[j]), { responseType: "arraybuffer", timeout: 15000 });
            fs.writeFileSync(p, Buffer.from(res.data));
            attachments.push(fs.createReadStream(p));
            paths.push(p);
          } catch (e) {
            continue;
          }
        }
        if (attachments.length) {
          await message.reply({ attachment: attachments });
          for (let pp of paths) if (fs.existsSync(pp)) fs.unlinkSync(pp);
          await new Promise(r => setTimeout(r, 800));
        }
      }
    };

    try {
      // Try MangaDex
      try {
        let s = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(name)}&limit=3`, { timeout: 8000 });
        if (s.data.data.length) {
          let id = s.data.data[0].id;
          let f = await axios.get(`https://api.mangadex.org/manga/${id}/feed?limit=100&translatedLanguage[]=en&order[chapter]=asc`, { timeout: 8000 });
          let ch = f.data.data.find(c => parseInt(c.attributes.chapter) == chapNum);
          if (ch) {
            let at = await axios.get(`https://api.mangadex.org/at-home/server/${ch.id}`, { timeout: 8000 });
            if (at.data.chapter.data.length) {
              if (searching) api.unsendMessage(searching.messageID);
              await send5(at.data.chapter.data, file => `${at.data.baseUrl}/data/${at.data.chapter.hash}/${file}`);
              return;
            }
          }
        }
      } catch (e) {}

      // Try Comick - backup
      try {
        let s = await axios.get(`https://api.comick.io/v1.0/search?query=${encodeURIComponent(name)}&limit=3`, { timeout: 8000 });
        if (s.data[0]) {
          let chs = await axios.get(`https://api.comick.io/comic/${s.data[0].slug}/chapters?chap=${chapNum}&lang=en`, { timeout: 8000 });
          let list = chs.data.chapters || chs.data;
          let ch = Array.isArray(list) ? list.find(c => c.chap == chapNum) || list[0] : list;
          if (ch) {
            let imgs = await axios.get(`https://api.comick.io/chapter/${ch.hid}/get_images`, { timeout: 8000 });
            if (imgs.data.length) {
              if (searching) api.unsendMessage(searching.messageID);
              await send5(imgs.data, file => file.url);
              return;
            }
          }
        }
      } catch (e) {}

      throw new Error("Not found");
    } catch (e) {
      if (searching) try { api.unsendMessage(searching.messageID); } catch {}
      return message.reply(`❌ Can't find ${name} Ch.${chapNum}`);
    }
  }
};
