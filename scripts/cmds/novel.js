const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["read","novels"],
version: "8.0-UNIVERSAL",
author: "Feng",
role: 0,
shortDescription: "Any novel LOTM/MP/RI",
category: "books",
guide: "{pn} lotm 5 | {pn} martial peak 8 | {pn} reverend insanity 18"
},
onStart: async function({ api, event, args, message }) {
if(!args[0]) return message.reply("Use: !novel lotm 5\n!novel martial peak 8\n!novel reverend insanity 18\n!novel solo leveling 1");

let raw = args.join(" ");
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let nameRaw = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
let name = nameRaw;
if(name.includes("lotm")) name = "lord of the mysteries";
if(name.includes("martial peak")) name = "martial peak";
if(name.includes("reverend insanity")) name = "reverend insanity";

let readingMsg = await message.reply(`📚 Reading ${nameRaw} chap ${chap}...`);
let readingID = readingMsg ? readingMsg.messageID : null;

function CLEAN(text, keepLong=true){
if(!text) return "";
// DON'T cut if text is short (fixes blank bug from last version)
if(text.length < 500) return text.replace(/https?:\/\/\S+/g,"").trim();

// Only cut footer, not story
let footer = text.toLowerCase().indexOf("you can support the novel");
if(footer > text.length*0.6) text = text.substring(0, footer); // only cut if at 60%+ end

return text
.replace(/Follow on Patreon.*|Follow on Feedly.*|Follow on Inoreader.*|Bookmark.*|Previous Next.*/gi,"")
.replace(/\{"thumbnail".*\}/gs,"")
.replace(/Translator:.*|Editor:.*|Divine Dao Library/gi,"")
.replace(/https?:\/\/[^\s]+/g,"")
.replace(/\s+/g," ")
.trim();
}

async function fetchViaProxy(url, selectors){
const proxies = [
`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
`https://corsproxy.io/?${encodeURIComponent(url)}`,
url
];
for(let pUrl of proxies){
try{
let {data} = await axios.get(pUrl, {timeout:12000, headers: {"User-Agent":"Mozilla/5.0"}});
let html = typeof data === "string" ? data : (data.contents || "");
if(!html || html.length < 400) continue;
const $ = cheerio.load(html);
$("script, style, noscript, iframe").remove();
for(let sel of selectors){
let t = $(sel).text();
if(t && t.length > 300) return CLEAN(t);
}
}catch(e){ continue; }
}
return null;
}

let text = null;
let slug = name.replace(/\s+/g,"-");

// 1. MARTIAL PEAK - Divine Dao with paragraph filter (fixes blank)
if(name.includes("martial peak")){
try{
let url = `https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`;
let pUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
let {data} = await axios.get(pUrl, {timeout:12000});
let html = typeof data === "string" ? data : (data.contents || "");
const $ = cheerio.load(html);
$("script").remove();
let paras = [];
$(".entry-content p").each((_,el)=>{
let t = $(el).text().trim();
if(t.length < 10) return;
let low = t.toLowerCase();
if(low.includes("support the novel") || low.includes("subscribe follow") || low.includes("previous next") || low.includes("bookmark") || t.includes("thumbnail")) return;
if(low.startsWith("translator:") || low.startsWith("editor:")) return;
paras.push(t);
});
if(paras.length >= 2) text = paras.join("\n\n");
}catch(e){}
if(!text) text = await fetchViaProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`, [".entry-content","article"]);
}

// 2. REVEREND INSANITY
if(!text && name.includes("reverend insanity")){
text = await fetchViaProxy(`https://asurascans.com/reverend-insanity-chapter-${chap}`, [".chapter-content",".entry-content"]);
if(!text) text = await fetchViaProxy(`https://novelfull.com/reverend-insanity/chapter-${chap}.html`, [".chapter-content","#chapter-content"]);
}

// 3. LORD OF THE MYSTERIES (LOTM) - NEW, FIXES YOUR SCREENSHOT
if(!text && name.includes("lord of the mysteries")){
// Source 1: novelbin via proxy (works if via proxy)
text = await fetchViaProxy(`https://novelbin.com/b/lord-of-the-mysteries/chapter-${chap}`, [".chapter-content","#chr-content",".txt","article"]);
// Source 2: lightnovelworld
if(!text) text = await fetchViaProxy(`https://www.lightnovelworld.com/novel/lord-of-the-mysteries-${1000+chap}/chapter-${chap}`, [".chapter-content",".content"]);
// Source 3: novelfull has LOTM
if(!text) text = await fetchViaProxy(`https://novelfull.com/lord-of-the-mysteries/chapter-${chap}.html`, [".chapter-content"]);
}

// 4. GENERIC - for ANY other novel (solo leveling, etc)
if(!text){
text = await fetchViaProxy(`https://novelfull.com/${slug}/chapter-${chap}.html`, [".chapter-content","#chapter-content"]);
if(!text) text = await fetchViaProxy(`https://novelbuddy.com/novel/${slug}/chapter-${chap}`, ["#chr-content",".chapter-content"]);
}

if(!text){
if(readingID) try{ api.unsendMessage(readingID); }catch{}
return message.reply(`❌ Can't get ${nameRaw} ${chap}\n\nSources blocked. Try:\n• !novel martial peak ${chap}\n• !novel lotm ${chap+1}\n\nIf still fail, say EMBEDDED and I give you version with LOTM 1-100 + MP 1-100 + RI 1-100 inside file (no internet)`);
}

if(readingID) try{ api.unsendMessage(readingID); }catch{}

if(text.length < 50) text = text + "\n\n[Chapter may be short or formatted]";

let parts = [];
for(let i=0;i<text.length;i+=1800) parts.push(text.substring(i,i+1800));

await message.reply(`📖 ${nameRaw.toUpperCase()} - Chap ${chap}\n━━━━━━━━━━━━━━\n\n`+parts[0]);
for(let i=1;i<parts.length;i++){
await new Promise(r=>setTimeout(r,700));
await message.reply(parts[i]);
}
await message.reply(`✅ End Chap ${chap} | Next: !novel ${nameRaw} ${chap+1}`);
}
};
