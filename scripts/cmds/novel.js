const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["read"],
version: "7.3-DEL-READING",
author: "Feng",
role: 0,
shortDescription: "Auto delete reading msg",
category: "books",
guide: "{pn} martial peak 2"
},
onStart: async function({ api, event, args, message }) {
if(!args[0]) return message.reply("Use: !novel martial peak 2");

let raw = args.join(" ");
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
let isRI = name.includes("reverend");
let isMP = name.includes("martial peak");

// 1. Send reading message and SAVE its ID
let readingMsg = await message.reply(`📚 Reading ${name} chap ${chap}...`);
let readingID = readingMsg ? readingMsg.messageID : null;

function CLEAN(text){
return text.replace(/\{.*thumbnail.*\}.*$/gs,"").replace(/Follow on Feedly.*$/gi,"").replace(/Inoreader.*$/gi,"").replace(/Bookmark.*$/gi,"").replace(/Previous Next.*$/gi,"").replace(/https?:\/\/[^\s]+/g,"").replace(/www\.[^\s]+/g,"").replace(/divinedaolibrary\.com[^\s]*/gi,"").replace(/Translator:.*|Editor:.*|Divine Dao Library/gi,"").replace(/\s+/g," ").trim();
}

async function getWithProxy(targetUrl, selectors){
const proxies = [
`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
targetUrl
];
for(let url of proxies){
try{
let {data} = await axios.get(url, {timeout: 10000, headers: {"User-Agent":"Mozilla/5.0"}});
let html = typeof data === "string" ? data : data.contents || "";
if(!html || html.length < 300) continue;
const $ = cheerio.load(html);
$("script, style, noscript, iframe").remove();
for(let sel of selectors){
let t = $(sel).text();
if(t && t.length > 500) return CLEAN(t);
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
let marker = new RegExp(`Chapter\\s*${chap}[^\\n]*\\n`, "i");
let m = full.match(marker);
if(m){
let start = full.indexOf(m[0]);
let nextChap = full.indexOf(`Chapter ${chap+1}`, start+10);
if(nextChap===-1) nextChap = start+12000;
text = full.substring(start, Math.min(nextChap, start+12000));
if(text) text = CLEAN(text);
}
}catch(e){}
if(!text) text = await getWithProxy(`https://asurascans.com/reverend-insanity-chapter-${chap}`, [".chapter-content",".entry-content","article"]);
}else if(isMP){
text = await getWithProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`, [".entry-content","article"]);
if(text && text.includes("thumbnail")){
try{
let {data} = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-"+chap+"/")}`, {timeout:10000});
const $ = cheerio.load(typeof data === "string" ? data : data.contents || "");
$("script").remove();
let paragraphs = [];
$(".entry-content p").each((i,el)=>{
let t = $(el).text().trim();
if(t.length > 20 && !t.includes("http") && !t.includes("thumbnail") && !t.includes("Follow")) paragraphs.push(t);
});
text = CLEAN(paragraphs.join("\n\n"));
}catch(e){}
}
}

if(!text){
// If failed, delete reading msg too and show error
if(readingID) try{ api.unsendMessage(readingID); }catch{}
return message.reply(`❌ Can't get ${name} ${chap}`);
}

// 2. DELETE the "Reading..." message as soon as we have the chapter
if(readingID){
try{ api.unsendMessage(readingID); }catch(e){ console.log("can't delete reading msg"); }
}

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
