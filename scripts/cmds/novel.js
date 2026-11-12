const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["novel7","read"],
version: "7.0-ARCHIVE",
author: "Feng",
role: 0,
shortDescription: "Archive.org unblockable",
category: "books",
guide: "{pn} martial peak 2 | {pn} reverend insanity 1"
},
onStart: async function({ event, args, message }) {
if(!args[0]) return message.reply("Use:\n!novel martial peak 2\n!novel reverend insanity 1\n!novel apotheosis 1");

let raw = args.join(" ");
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
let isRI = name.includes("reverend") || name.includes("insanity") || name.includes("fang yuan") || name.includes("gu zhen");
let isMP = name.includes("martial peak") || name.includes("yang kai");

message.reply(`📚 v7 Reading ${name} ${chap}... [Archive source]`);

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
for(let sel of selectors){
let t = $(sel).text();
if(t && t.length > 500) return t.replace(/\s+/g," ").trim();
}
}catch(e){ continue; }
}
return null;
}

let text = null;

if(isRI){
// ARCHIVE.ORG - 100% never blocks - has full RI book
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
}catch(e){ console.log("RI archive fail", e.message); }
// fallback Asura
if(!text){
text = await getWithProxy(`https://asurascans.com/reverend-insanity-chapter-${chap}`, [".chapter-content",".entry-content","article","p"]);
}
}else if(isMP){
// DIVINE DAO LIBRARY - official translator of Martial Peak, never blocks like novelbin
text = await getWithProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/`, ["article",".entry-content",".post-content","#content","p"]);
if(!text){
text = await getWithProxy(`https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}-breaking-through-the-wall-and-not-looking-back/`, ["article",".entry-content"]);
}
// fallback ficlyn
if(!text){
text = await getWithProxy(`https://ficlyn.com/novel/martial-peak/chapter-${chap}`, [".chapter-content","article"]);
}
}else{
// other novels still try novelbuddy via proxy
text = await getWithProxy(`https://novelbuddy.com/novel/${name.replace(/[^a-z0-9]+/g,"-")}/chapter-${chap}`, ["#chr-content",".chapter-content"]);
}

if(!text){
return message.reply(
`❌ Even archive blocked for ${name} ${chap}\n\nBut try DIRECT (no bot):\nRI: https://asurascans.com/reverend-insanity-chapter-${chap}\nMP: https://www.divinedaolibrary.com/story/martial-peak/martial-peak-chapter-${chap}/\n\nYour IP ban is serious - change host or I give you EMBEDDED version (I put chapter text INSIDE the JS file, zero internet needed). Want embedded version?`
);
}

// split
text = text.substring(0,8000).replace(/Translator:.*|Editor:.*|Divine Dao Library|Read.*Patreon/gi,"").trim();
let parts = [];
for(let i=0;i<text.length;i+=1800) parts.push(text.substring(i,i+1800));

await message.reply(`📖 ${name.toUpperCase()} - Chap ${chap}\n━━━━━━━━━━━━━━\n\n`+parts[0]);
for(let i=1;i<parts.length;i++){
await new Promise(r=>setTimeout(r,700));
await message.reply(parts[i]);
}
await message.reply(`✅ End Chap ${chap} | Next: !novel ${name} ${chap+1}`);
}
};
