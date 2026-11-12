const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["novelbin","readnovel"],
version: "3.0-PROXY",
author: "Feng",
role: 0,
shortDescription: "Full text proxy",
longDescription: "Uses proxy to bypass block",
category: "books",
guide: "{pn} reverend insanity 1"
},
onStart: async function({ event, args, message }) {
if(!args[0]) return message.reply("Use: !novel <name> <chap>\nEx: !novel reverend insanity 1\n!novel martial peak 100");

let raw = args.join(" ");
let chapMatch = raw.match(/(?:chap|chapter|c)?\s*(\d+)\s*$/i);
let chap = chapMatch ? parseInt(chapMatch[1]) : 1;
let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim() || "reverend insanity";

const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
await message.reply(`📚 Proxy reading **${name}** chap ${chap}... Please wait 3s`);

const proxies = [
(u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
(u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
(u) => `https://corsproxy.io/?${encodeURIComponent(u)}`
];

const sources = [
`https://novelbin.com/b/${slug}/chapter-${chap}`,
`https://novelbin.me/b/${slug}/chapter-${chap}`,
`https://novelbin.com/b/${slug}/chapter-${chap}-revenge`,
`https://novelbuddy.com/novel/${slug}/chapter-${chap}`
];

let fullText = null;
let title = `Chapter ${chap}`;

for(let src of sources){
for(let proxyFn of proxies){
try{
let proxiedUrl = proxyFn(src);
let {data} = await axios.get(proxiedUrl, { timeout: 20000, headers: {"User-Agent":"Mozilla/5.0"} });
let html = typeof data === "string" ? data : data.contents || JSON.stringify(data);
if(!html || html.length < 500) continue;
const $ = cheerio.load(html);
let t = $("#chr-content").text() || $(".chapter-content").text() || $("#chapter-content").text() || $("#content").text() || $(".txt").text() || $("article").text();
t = t.replace(/\s+/g," ").replace(/novelbin\.com|Read more.*|Translator.*/gi,"").trim();
if(t.length > 800){
fullText = t;
title = $("h1").first().text().trim() || `Chapter ${chap}`;
console.log("SUCCESS", src, "via proxy", t.length);
break;
}
}catch(e){ console.log("proxy fail", e.message); }
}
if(fullText) break;
}

if(!fullText){
return message.reply(`❌ Still blocked for ${name} ${chap}\n\nTry these that are 100% working:\n!novel martial peak 1\n!novel apotheosis 1\n!novel tales of demons and gods 1\n!novel lord of mysteries 1\n\nReverend Insanity is heavily DMCA, if fail try chap 2-5 sometimes chap 1 is blocked more.`);
}

// Split send
let clean = fullText.replace(/\n{3,}/g,"\n\n");
let header = `📖 ${name.toUpperCase()}\n${title} - Chap ${chap}\n━━━━━━━━━━━━━━\n\n`;
let remaining = clean;
let firstChunk = header + remaining.substring(0, 1800);
await message.reply(firstChunk);
remaining = remaining.substring(1800);

while(remaining.length > 0){
await new Promise(r=>setTimeout(r,900));
let chunk = remaining.substring(0,1900);
await message.reply(chunk);
remaining = remaining.substring(1900);
}
await message.reply(`✅ End Chap ${chap}\nNext: !novel ${name} ${chap+1}`);
}
};
