const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["read"],
version: "7.4-FINAL",
author: "Feng",
role: 0,
shortDescription: "MP clean + RI fixed",
category: "books",
guide: "{pn} martial peak 8 | {pn} reverend insanity 18"
},
onStart: async function({ api, event, args, message }) {
if(!args[0]) return message.reply("Use: !novel martial peak 8");

let raw = args.join(" ");
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
let isRI = name.includes("reverend") || name.includes("insanity");
let isMP = name.includes("martial peak");

let readingMsg = await message.reply(`📚 Reading ${name} chap ${chap}...`);
let readingID = readingMsg ? readingMsg.messageID : null;

function CLEAN(text){
if(!text) return "";
// Cut off at the spam footer - THIS FIXES YOUR SCREENSHOT
let cutMarkers = [
"You can support the novel",
"Subscribe Follow",
"Follow on Patreon",
"Follow on Feedly",
"Previous Next",
"Bookmark",
'{"thumbnail"',
'"link":'
];
for(let marker of cutMarkers){
let idx = text.indexOf(marker);
if(idx !== -1) text = text.substring(0, idx);
}
return text
.replace(/https?:\/\/[^\s]+/g, "")
.replace(/www\.[^\s]+/g, "")
.replace(/Translator:.*|Editor:.*|Proofreader:.*|Divine Dao Library/gi, "")
.replace(/Ben:.*|Silavin:.*|\(Ben:.*\)/gi, "") // removes (Ben: GG I had high hopes...)
.replace(/\s+/g, " ")
.trim();
}

async function getWithProxy(targetUrl, selectors){
const proxies = [
`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
targetUrl
];
for(let url of proxies){
try{
let {data} = await axios.get(url, {timeout: 12000, headers: {"User-Agent":"Mozilla/5.0"}});
let html = typeof data === "string" ? data : (data.contents || "");
if(!html || html.length < 300) continue;
const $ = cheerio.load(html);
$("script, style, noscript, iframe, .sharedaddy, .post-navigation, .jp-relatedposts").remove();
for(let sel of selectors){
let t = $(sel).text();
if(t && t.length > 400) return CLEAN(t);
}
}catch(e){ continue; }
}
return null;
}

let text = null;

if(isRI){
// NEW: Try 3 different RI sources, archive method improved
// 1. AsuraScans via proxy (most reliable for RI 18)
text = await getWithProxy(`https://asurascans.com/reverend-insanity-chapter-${chap}`, [".chapter-content",".entry-content","article","#content","p"]);
// 2. Novelfull (has RI)
if(!text) text = await getWithProxy(`https://novelfull.com/reverend-insanity/chapter-${chap}.html`, [".chapter-content","#chapter-content"]);
// 3. Archive.org - FIXED for chap 18 (regex was failing)
if(!text){
try{
let {data} = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://ia800805.us.archive.org/32/items/reverend-insanity/Reverend%20Insanity.txt")}`, {timeout:15000});
let full = typeof data === "string" ? data : (data.contents || "");
// Better search: find "Chapter 18" with any separator
let regex = new RegExp(`Chapter\\s+0*${chap}[\\s\\-–:]+[^\\n]*\\n`, "i");
let m = full.match(regex);
if(m){
let start = full.indexOf(m[0]);
let nextRegex = new RegExp(`\\nChapter\\s+0*${chap+1}[\\s\\-–:]+`, "i");
let nextMatch = full.substring(start+100).match(nextRegex);
let end = nextMatch ? start+100+nextMatch.index : start+15000;
text = CLEAN(full.substring(start, Math.min(end, start+15000)));
}
}catch(e){ console.log("RI archive fail", e.message); }
}
}else if(isMP){
// FIXED: Get ONLY <p> tags, ignore footer
try{
let proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`)}`;
let {data} = await axios.get(proxyUrl, {timeout:12000});
let html = typeof data === "string" ? data : (data.contents || "");
const $ = cheerio.load(html);
$("script, style").remove();
let paragraphs = [];
$(".entry-content p").each((i,el)=>{
let t = $(el).text().trim();
// SKIP spam paragraphs (this fixes your screenshot)
if(t.length < 15) return;
if(t.includes("support the novel") || t.includes("Follow on") || t.includes("Bookmark") || t.includes("Previous Next") || t.includes("Patreon") || t.includes("http") || t.includes("thumbnail")) return;
if(t.startsWith("Translator:") || t.startsWith("Editor:")) return;
paragraphs.push(t);
});
if(paragraphs.length > 2) text = CLEAN(paragraphs.join("\n\n"));
}catch(e){ console.log("MP p parse fail"); }

if(!text) text = await getWithProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`, [".entry-content","article"]);
}

if(!text){
if(readingID) try{ api.unsendMessage(readingID); }catch{}
return message.reply(`❌ Can't get ${name} ${chap}\n\nTry: !novel ${name} ${chap+1} or !novel martial peak 1\nIf RI still fails, your host blocks Asura too. Tell me and I give you EMBEDDED RI 1-100 (no internet needed)`);
}

if(readingID) try{ api.unsendMessage(readingID); }catch{}

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
