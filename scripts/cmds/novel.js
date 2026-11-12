const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  config: { 
    name: "novel", 
    aliases: ["novel7","read"], 
    version: "7.1-FULL-FIX", 
    author: "Feng", 
    role: 0, 
    shortDescription: "Archive.org unblockable", 
    category: "books", 
    guide: "{pn} martial peak 2 | {pn} reverend insanity 1" 
  },
  onStart: async function({ args, message }) {
    if(!args[0]) return message.reply("Use:\n!novel martial peak 2\n!novel reverend insanity 1");
    
    let raw = args.join(" ");
    let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
    let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
    
    let isRI = name.includes("reverend") || name.includes("insanity") || name.includes("fang yuan");
    let isMP = name.includes("martial peak") || name.includes("yang kai");
    
    await message.reply(`📚 Reading ${name} ${chap}... [Archive source]`);

    async function getWithProxy(targetUrl, selectors){
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        targetUrl
      ];
      for(let url of proxies){
        try{
          let {data} = await axios.get(url, {timeout: 15000, headers: {"User-Agent":"Mozilla/5.0"}});
          let html = typeof data === "string" ? data : data.contents || "";
          if(!html || html.length < 300) continue;
          const $ = cheerio.load(html);
          $("[style]").removeAttr("style");
          $("script, .ads, .advertisement, nav, header, footer, .chapter-nav, .nav-links").remove();
          for(let sel of selectors){
            let t = $(sel).text();
            if(t && t.length > 500) return t;
          }
        }catch(e){ continue; }
      }
      return null;
    }

    let text = null;

    if(isRI){
      try{
        let {data} = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://ia800805.us.archive.org/32/items/reverend-insanity/Reverend%20Insanity.txt")}`, {timeout:15000});
        let full = typeof data === "string" ? data : data.contents || "";
        let chapMarker = new RegExp(`Chapter\\s*${chap}[^\\n]*\\n`, "i");
        let m = full.match(chapMarker);
        if(m){
          let start = full.indexOf(m[0]);
          let nextChap = full.indexOf(`Chapter ${chap+1}`, start+10);
          if(nextChap===-1) nextChap = start+15000;
          text = full.substring(start, Math.min(nextChap, start+12000));
        }
      }catch(e){}
      if(!text){
        text = await getWithProxy(`https://asurascans.com/reverend-insanity-chapter-${chap}`, [".chapter-content",".entry-content","article"]);
      }
    }else if(isMP){
      text = await getWithProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`, ["article",".entry-content",".post-content","#content"]);
      if(!text){
        text = await getWithProxy(`https://ficlyn.com/novel/martial-peak/chapter-${chap}`, [".chapter-content","article"]);
      }
    }else{
      text = await getWithProxy(`https://novelbuddy.com/novel/${name.replace(/[^a-z0-9]+/g,"-")}/chapter-${chap}`, ["#chr-content",".chapter-content"]);
    }

    if(!text){
      return message.reply(`❌ Blocked for ${name} ${chap}\nRI: https://asurascans.com/reverend-insanity-chapter-${chap}\nMP: https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`);
    }

    // FULL CLEAN - removes your Formatting Previous Next junk
    text = text
      .replace(/Formatting Previous Next.*?(Chapter|Translator)/gi, "")
      .replace(/Previous\s*Next/gi, "")
      .replace(/Translator:.*|Editor:.*|Divine Dao Library.*|Read.*Patreon.*|Join our Discord.*|Support us on.*|Asura Scans.*/gi, "")
      .replace(/Martial Peak\s*Chapter\s*\d+.*?\n/i, "")
      .replace(/\s+\n/g,"\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim()
      .substring(0,10000);

    let parts = [];
    for(let i=0;i<text.length;i+=1800) parts.push(text.substring(i,i+1800));
    
    await message.reply(`📖 ${name.toUpperCase()} - Chap ${chap}\n━━━━━━━━━━━━━━\n\n`+parts[0]);
    for(let i=1;i<parts.length;i++){
      await new Promise(r=>setTimeout(r,600));
      await message.reply(parts[i]);
    }
    await message.reply(`✅ End Chap ${chap} | Next: !novel ${name} ${chap+1}`);
  }
};
