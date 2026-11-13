const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "manga",
    aliases: ["manhwa","manhua","manwa"],
    version: "3.2-CLEAN-RAM-FIXED",
    author: "Feng",
    role: 0,
    category: "anime",
    guide: "{pn} solo leveling 10"
  },
  onStart: async function({ api, event, args, message }) {
    let raw = args.join(" ").trim();
    if(!raw) return message.reply("Usage: !manga solo leveling 5");
    
    let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
    let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();
    
    let loadMsg;
    try {
      loadMsg = await api.sendMessage(`📚 Loading ${nameRaw} ch.${chap}...`, event.threadID);
    } catch {}

    try {
      let sUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(nameRaw)}&limit=3`;
      let {data: sData} = await axios.get(sUrl, {timeout:15000});
      if(!sData.data.length) {
        if(loadMsg) api.unsendMessage(loadMsg.messageID);
        return message.reply(`❌ Not found: ${nameRaw}`);
      }

      let mangaId = sData.data[0].id;
      let title = sData.data[0].attributes.title.en || sData.data[0].attributes.title[Object.keys(sData.data[0].attributes.title)[0]] || nameRaw;

      let cUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
      let {data: cData} = await axios.get(cUrl, {timeout:15000});
      
      let found = cData.data.find(c=> parseInt(c.attributes.chapter)==chap) || cData.data[chap-1];
      if(!found) {
        if(loadMsg) api.unsendMessage(loadMsg.messageID);
        return message.reply(`❌ Chapter ${chap} not found`);
      }

      let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${found.id}`, {timeout:15000});
      let host = server.baseUrl, hash = server.chapter.hash, pages = server.chapter.data;

      if(loadMsg) api.unsendMessage(loadMsg.messageID);
      await message.reply(`📖 ${title} Ch.${chap} - ${pages.length} pages`);

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      for(let start=0; start<pages.length; start+=5){
        let batch = pages.slice(start, start+5);
        let attachments = [];
        let paths = [];

        for(let i=0; i<batch.length; i++){
          let f = batch[i];
          try{
            let p = path.join(cacheDir, `manga_${Date.now()}_${start}_${i}.jpg`);
            let r = await axios.get(`${host}/data/${hash}/${f}`, {
              responseType: "arraybuffer",
              timeout: 20000,
              headers: {"Referer":"https://mangadex.org/"}
            });
            fs.writeFileSync(p, Buffer.from(r.data));
            attachments.push(fs.createReadStream(p));
            paths.push(p);
          }catch(e){}
        }

        if(attachments.length>0){
          await api.sendMessage({ 
            body: `📖 ${title} Ch.${chap} [${start+1}-${Math.min(start+5,pages.length)}/${pages.length}]`, 
            attachment: attachments 
          }, event.threadID);
        }

        // CLEAN RAM
        for(let pp of paths) if(fs.existsSync(pp)) fs.unlinkSync(pp);
        attachments = null;
        paths = null;
        if(global.gc) global.gc();
        await new Promise(r=>setTimeout(r,800));
      }

      await message.reply(`✅ Done! ${title} Ch.${chap} - ${pages.length} pages`);
    }catch(e){
      if(loadMsg) try{ api.unsendMessage(loadMsg.messageID); }catch{}
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
