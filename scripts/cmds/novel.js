const axios = require("axios");
const cheerio = require("cheerio");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

module.exports = {
  config: { name: "novel", aliases: ["read","ln"], version: "20-DNS-FIX", author: "Feng", role: 0, category: "books", guide: "{pn} demon emperor 1" },
  onStart: async function({ api, event, args, message }) {
    let raw = args.join(" ").trim();
    if(!raw) return message.reply("Usage: !novel demon emperor 1");
    let chap = parseInt(raw.match(/(?:chapter|chap|ch|c)?\s*(\d+)\s*$/i)?.[1] || 1);
    let nameRaw = raw.replace(/(?:chapter|chap|ch|c)?\s*\d+\s*$/i,"").trim();
    if(!nameRaw) return message.reply("Give novel name");

    await message.reply(`🔍 Searching: "${nameRaw}" ch.${chap}...`);

    const HEADERS = { "User-Agent": "Mozilla/5.0 Chrome/120.0" };
    
    async function getHtml(url){
      try{
        let {data} = await axios.get(url, {timeout:15000, headers: HEADERS, family: 4});
        if(data && data.length > 500) return data;
      }catch(e){ console.log(e.message); }
      // proxy fallback
      try{
        let {data} = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {timeout:15000, family: 4});
        return data;
      }catch(e){ return null; }
    }

    try{
      let searchUrl = `https://novelbin.com/search?keyword=${encodeURIComponent(nameRaw)}`;
      let searchHtml = await getHtml(searchUrl);
      if(!searchHtml) return message.reply(`❌ Search failed. ENOTFOUND again = Railway Trial blocking. Read here: ${searchUrl}`);

      let $ = cheerio.load(searchHtml);
      let firstLink = $(".list-novel .row a").first().attr("href") || $("a[href*='/b/']").first().attr("href");
      if(!firstLink) return message.reply(`❌ No novel found for "${nameRaw}"`);

      if(!firstLink.startsWith("http")) firstLink = "https://novelbin.com" + firstLink;
      let baseNovelUrl = firstLink.split("/chapter")[0];
      let chapterUrl = `${baseNovelUrl}/chapter-${chap}.html`;

      let data = await getHtml(chapterUrl);
      if(!data) data = await getHtml(`${baseNovelUrl}/chapter-${chap}`);
      if(!data) return message.reply(`❌ Blocked. Link: ${chapterUrl}`);

      let $c = cheerio.load(data);
      $c("script,style,iframe").remove();
      let text = $c("#chr-content").text() || $c("#chapter-content").text() || $c(".chapter-c").text();
      text = text.trim().replace(/\n{3,}/g,"\n\n");
      if(text.length < 300) return message.reply(`❌ Ch.${chap} not released. Link: ${chapterUrl}`);

      let clean = text.substring(0,12000);
      let parts=[]; for(let i=0;i<clean.length;i+=1800) parts.push(clean.substring(i,i+1800));
      
      await message.reply(`📖 ${nameRaw.toUpperCase()} - Ch.${chap}\n${chapterUrl}\n\n${parts[0]}`);
      for(let i=1;i<parts.length;i++){
        await new Promise(r=>setTimeout(r,600));
        await message.reply(parts[i]);
      }
    }catch(e){ return message.reply(`❌ Error: ${e.message}`); }
  }
};
