const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: "ln",
    aliases: ["lightnovel", "wuxia", "ltnovel"],
    version: "1.0",
    author: "Feng",
    role: 0,
    category: "books",
    guide: "{pn} solo leveling 1 | {pn} overlord 1"
  },
  onStart: async function({ api, event, args, message }) {
    if (!args[0]) return message.reply("Use:\n!ln solo leveling 1\n!ln overlord 1");
    
    let raw = args.join(" ");
    let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
    let name = raw.replace(/\s*\d+\s*$/, "").trim().toLowerCase();

    let loading;
    try { loading = await api.sendMessage(`📚 Reading ${name} Ch.${chap}...`, event.threadID); } catch {}

    async function getLN(targetUrl, selectors){
      try {
        let proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        let {data} = await axios.get(proxy, {timeout: 15000, headers: {"User-Agent":"Mozilla/5.0"}});
        let html = typeof data === "string" ? data : data.contents || "";
        if(!html || html.length < 400) return null;
        const $ = cheerio.load(html);
        $("script, style, nav, header, footer, .ads, iframe, .chapter-nav").remove();
        for(let sel of selectors){
          let t = $(sel).text();
          if(t && t.trim().length > 500) return t;
        }
      } catch { return null; }
      return null;
    }

    try {
      let slug = name.replace(/[^a-z0-9]+/g, "-");
      let text = null;

      text = await getLN(`https://novelpub.com/novel/${slug}/chapter-${chap}`, ["#chr-content", ".chapter-content", "article"]);
      if(!text) text = await getLN(`https://www.lightnovelworld.com/novel/${slug}/chapter-${chap}`, [".chapter-content", "#chapter-content"]);
      if(!text) text = await getLN(`https://novelbuddy.com/novel/${slug}/chapter-${chap}`, ["#chr-content", ".chapter-content"]);

      if(!text){
        if(loading) api.unsendMessage(loading.messageID);
        return message.reply(`❌ Can't find ${name} Ch.${chap}\nTry: !novel ${name} ${chap}`);
      }

      text = text
        .replace(/Translator:.*|Editor:.*|Read.*Patreon.*|Join our Discord.*|Support us.*/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .substring(0, 10000);

      if(loading) api.unsendMessage(loading.messageID);

      let parts = [];
      for(let i=0;i<text.length;i+=1800) parts.push(text.substring(i,i+1800));

      await message.reply(`📖 ${name.toUpperCase()} - LN Ch.${chap}\n━━━━━━━━━━━━━━\n\n`+parts[0]);
      for(let i=1;i<parts.length;i++){
        await new Promise(r=>setTimeout(r,600));
        await message.reply(parts[i]);
      }
      return message.reply(`✅ End | Next: !ln ${name} ${chap+1}`);

    } catch(e){
      if(loading) try{ api.unsendMessage(loading.messageID); }catch{}
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
