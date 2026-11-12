const axios = require("axios"); 
const cheerio = require("cheerio"); 

module.exports = { 
config: { name: "novel", aliases: ["read","ln"], version: "19-FIXED-PROXY", author: "Feng", role: 0, category: "books", guide: "{pn} any novel name 1" }, 

onStart: async function({ api, event, args, message }) { 
let raw = args.join(" ").trim(); 
if(!raw) return message.reply("Usage: !novel demon emperor 1\n!novel any title 20"); 

let chap = parseInt(raw.match(/(?:chapter|chap|ch|c)?\s*(\d+)\s*$/i)?.[1] || 1); 
let nameRaw = raw.replace(/(?:chapter|chap|ch|c)?\s*\d+\s*$/i,"").trim(); 
if(!nameRaw) return message.reply("Give novel name"); 

await message.reply(`🔍 Searching ANY novel: "${nameRaw}" ch.${chap}...`); 

const PROXIES = [
  "", // direct first, no proxy
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://fengbot-proxy.chekenwkx.workers.dev/?url="
];
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" };

async function getHtml(url){
 for(let p of PROXIES){
  try{
   let finalUrl = p ? p + encodeURIComponent(url) : url;
   let {data} = await axios.get(finalUrl, {timeout:15000, headers: HEADERS});
   if(data && data.length > 500) return data;
  }catch(e){ continue; }
 }
 return null;
}

try{
let searchUrl = `https://novelbin.com/search?keyword=${encodeURIComponent(nameRaw)}`; 
let searchHtml = await getHtml(searchUrl);
if(!searchHtml) return message.reply(`❌ Search blocked. Try: !novel ${nameRaw} ${chap} again`);

let $ = cheerio.load(searchHtml); 
let firstLink = $(".list-novel .row a").first().attr("href") || $("a[href*='/b/']").first().attr("href") || $(".col-novel-main a").first().attr("href");

if(!firstLink){ 
  let s2 = `https://novelfull.com/search?keyword=${encodeURIComponent(nameRaw)}`; 
  let h2 = await getHtml(s2);
  if(h2){
    let $$ = cheerio.load(h2); 
    firstLink = $$(".list-truyen .row a").first().attr("href");
  }
} 

if(!firstLink) return message.reply(`❌ No novel found for "${nameRaw}"`); 
if(!firstLink.startsWith("http")) firstLink = "https://novelbin.com" + firstLink; 

let baseNovelUrl = firstLink.split("/chapter")[0]; 
let chapterUrl = `${baseNovelUrl}/chapter-${chap}.html`; 
await message.reply(`📖 Found: ${baseNovelUrl}\nLoading ch.${chap}...`); 

let data = await getHtml(chapterUrl);
if(!data){
 let alt = `${baseNovelUrl}/chapter-${chap}`;
 data = await getHtml(alt);
}

if(!data) return message.reply(`❌ Blocked. Read here: ${chapterUrl}`);

let $c = cheerio.load(data); 
$c("script,style,iframe,div.ads, .ads").remove(); 
let text = $c("#chr-content").text() || $c("#chapter-content").text() || $c(".chapter-c").text(); 
text = text.trim().replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n"); 

if(text.length < 300) return message.reply(`❌ Found novel but ch.${chap} not released.\nLink: ${chapterUrl}`); 

let clean = text.substring(0,12000); 
let parts=[]; 
for(let i=0;i<clean.length;i+=1800) parts.push(clean.substring(i,i+1800)); 

await message.reply(`📖 ${nameRaw.toUpperCase()} - Ch.${chap}\nSource: ${chapterUrl}\n\n${parts[0]}`); 
for(let i=1;i<parts.length;i++){ 
 await new Promise(r=>setTimeout(r,600)); 
 await message.reply(parts[i]); 
} 
}catch(e){ 
return message.reply(`❌ Error: ${e.message}`); 
} 
} 
};
