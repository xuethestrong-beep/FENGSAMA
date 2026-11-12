const axios = require("axios");
const cheerio = require("cheerio");
module.exports = {
config: { name: "novel", aliases: ["read","ln"], version: "18-ANY-NOVEL", author: "Feng", role: 0, category: "books", guide: "{pn} any novel name 1" },
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !novel demon emperor 1\n!novel any title 20");
let chap = parseInt(raw.match(/(?:chapter|chap|ch|c)?\s*(\d+)\s*$/i)?.[1] || 1);
let nameRaw = raw.replace(/(?:chapter|chap|ch|c)?\s*\d+\s*$/i,"").trim();
if(!nameRaw) return message.reply("Give novel name");
await message.reply(`🔍 Searching ANY novel: "${nameRaw}" ch.${chap}...`);

const PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" };

try{
// Step 1: Search on novelbin
let searchUrl = `https://novelbin.com/search?keyword=${encodeURIComponent(nameRaw)}`;
let {data: searchHtml} = await axios.get(PROXY + encodeURIComponent(searchUrl), {timeout:20000, headers: HEADERS});
let $ = cheerio.load(searchHtml);
let firstLink = $(".list-novel .row a").first().attr("href") || $(".col-novel-main a").first().attr("href") || $("a[href*='/b/']").first().attr("href");
if(!firstLink){
 // try novelfull search
 let s2 = `https://novelfull.com/search?keyword=${encodeURIComponent(nameRaw)}`;
 let {data: h2} = await axios.get(PROXY + encodeURIComponent(s2), {timeout:20000, headers: HEADERS});
 let $$ = cheerio.load(h2);
 firstLink = $$(".list-truyen .row a").first().attr("href") || $$("a[href*='/']").first().attr("href");
}
if(!firstLink) return message.reply(`❌ No novel found for "${nameRaw}"\nTry more exact name: !novel martial peak 1`);

if(!firstLink.startsWith("http")) firstLink = "https://novelbin.com" + firstLink;
let baseNovelUrl = firstLink.split("/chapter")[0];
let chapterUrl = `${baseNovelUrl}/chapter-${chap}.html`;

await message.reply(`📖 Found: ${baseNovelUrl}\nLoading ch.${chap}...`);

let {data} = await axios.get(PROXY + encodeURIComponent(chapterUrl), {timeout:20000, headers: HEADERS});
let $c = cheerio.load(data);
$c("script,style,iframe,div.ads").remove();
let text = $c("#chr-content").text() || $c("#chapter-content").text() || $c(".chapter-c").text() || $c("#chapter-content").text() || $c(".col-xs-12").text();
text = text.trim().replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n");
if(text.length < 300){
 // try without .html
 let alt = `${baseNovelUrl}/chapter-${chap}`;
 let {data: d2} = await axios.get(PROXY + encodeURIComponent(alt), {timeout:20000, headers: HEADERS});
 let $d = cheerio.load(d2);
 text = $d("#chr-content").text() || $d("#chapter-content").text();
 text = text.trim();
}
if(text.length < 300) return message.reply(`❌ Found novel but ch.${chap} not yet released or blocked.\nLink: ${baseNovelUrl}\nTry: ${baseNovelUrl}/chapter-${chap}.html`);

let clean = text.substring(0,12000);
let parts=[];
for(let i=0;i<clean.length;i+=1800) parts.push(clean.substring(i,i+1800));
await message.reply(`📖 ${nameRaw.toUpperCase()} - Ch.${chap}\nSource: ${chapterUrl}\n\n${parts[0]}`);
for(let i=1;i<parts.length;i++){ await new Promise(r=>setTimeout(r,600)); await message.reply(parts[i]); }

}catch(e){
return message.reply(`❌ Error: ${e.message}\nTry: !novel martial peak 1\nIf still fails, tell me novel name + site you read it`);
}
}
};
