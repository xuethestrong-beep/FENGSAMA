const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["read","novels"],
version: "14.0-AUTO-SEARCH",
author: "Feng",
role: 0,
category: "books",
guide: "{pn} lord of the mysteries 20 | {pn} martial peak 13"
},
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !novel lord of the mysteries 20\n!novel martial peak 13\n!novel solo leveling 5");

let chap = parseInt(raw.match(/(\d+)\s*$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();

const PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Referer": "https://novelfull.com/" };

await message.reply(`🔍 Searching "${nameRaw}" ch.${chap}...`);

// FIX SLUGS
let slugMap = {
"lord of the mystery": "lord-of-the-mysteries",
"lord of the mysteries": "lord-of-the-mysteries",
"lotm": "lord-of-the-mysteries",
"martial arts": "martial-peak",
"martial peak": "martial-peak",
"mp": "martial-peak",
"solo leveling": "solo-leveling",
"orv": "omniscient-reader",
"omniscient reader": "omniscient-reader",
"tensura": "tensei-shitara-slime-datta-ken",
"reincarnated as slime": "tensei-shitara-slime-datta-ken",
"shadow slave": "shadow-slave",
"tbate": "the-beginning-after-the-end",
"beginning after the end": "the-beginning-after-the-end"
};
let slug = slugMap[nameRaw] || nameRaw.replace(/\s+/g,"-");

// Try 3 SITES + Search
let targets = [
`https://novelfull.com/${slug}/chapter-${chap}.html`,
`https://novelfull.com/${slug}/chapter-${chap}-.html`,
`https://novelfull.com/${slug}/chapter-${chap}.html?`,
`https://novelbin.com/b/${slug}/chapter-${chap}.html`,
`https://novelhall.com/${slug}/${chap}/`,
`https://www.lightnovelworld.com/novel/${slug}/chapter-${chap}`
];

for(let target of targets){
try{
let url = PROXY + encodeURIComponent(target);
let {data} = await axios.get(url, {timeout:25000, headers: HEADERS});
let $ = cheerio.load(data);
$("script,style,.ads,.ad,.google-auto-placed").remove();

// Try all possible selectors
let text = $("#chapter-content").text() || $(".chapter-c").text() || $("#chr-content").text() || $(".txt").text() || $("#content").text() || $(".chapter-content").text() || $("div.chapter").text();

text = text.trim().replace(/Not Found/gi,"").replace(/\n{3,}/g,"\n\n");

if(text && text.length > 800){
let clean = text.substring(0, 9000);
let parts = [];
for(let i=0;i<clean.length;i+=1800) parts.push(clean.substring(i,i+1800));
await message.reply(`📖 ${nameRaw.toUpperCase()} - Chapter ${chap}\nFrom: ${target}\n━━━━━━━━━━━━\n\n${parts[0]}`);
for(let i=1;i<parts.length;i++){ await new Promise(r=>setTimeout(r,800)); await message.reply(parts[i]); }
return;
}
}catch(e){ continue; }
}

// FALLBACK: Search on Novelfull
try{
let searchUrl = PROXY + encodeURIComponent(`https://novelfull.com/search?keyword=${encodeURIComponent(nameRaw)}`);
let {data} = await axios.get(searchUrl, {timeout:20000, headers: HEADERS});
let $ = cheerio.load(data);
let found = [];
$("a[href*='/']").each((i,el)=>{
let href = $(el).attr("href") || "";
let title = $(el).text().trim();
if(href.includes("/") && title.toLowerCase().includes(nameRaw.split(" ")[0]) && href.length<100) found.push(`https://novelfull.com${href}`);
});
if(found.length>0) return message.reply(`❌ Chapter ${chap} not found, but novel exists:\n${[...new Set(found)].slice(0,3).join("\n")}\n\nTry different chapter number.`);
}catch(e){}

return message.reply(`❌ Not found: ${nameRaw} ch.${chap}\n\nTry exact:\n!novel lord of the mysteries 20\n!novel martial peak 13\n!novel shadow slave 1\n\nIf still fails, tell me the novel - I will add its slug.`);
}
};
