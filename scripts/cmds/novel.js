const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "novel",
aliases: ["read"],
version: "13.0-PROXY-FIXED",
author: "Feng",
role: 0,
category: "books",
guide: "{pn} lotm 5 | {pn} tensura 9 | {pn} orv 1"
},
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !novel lotm 5\n!novel tensura 9\n!novel orv 1");

let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();

let slug = nameRaw.replace(/\s+/g,"-");
if(slug.includes("lotm")||slug.includes("lord")) slug="lord-of-the-mysteries";
else if(slug.includes("tensura")||slug.includes("slime")) slug="tensei-shitara-slime-datta-ken";
else if(slug.includes("orv")) slug="omniscient-reader";
else if(slug=="mp"||slug.includes("martial")) slug="martial-peak";

const PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";

const sources = [
`https://novelfull.com/${slug}/chapter-${chap}.html`,
`https://novelfull.com/${slug}/chapter-${chap}-.html`,
`https://novelfull.com/${slug}/c${chap}.html`
];

await message.reply(`🔍 Proxy OK! Searching ${nameRaw} chapter ${chap}...`);

for(let target of sources){
try{
let url = PROXY + encodeURIComponent(target);
let {data} = await axios.get(url, {timeout: 30000});
let $ = cheerio.load(data);
$(".ads,script,style").remove();
let text = $(".chapter-c").text() || $("#chapter-content").text() || $(".chapter-content").text() || $("div#chr-content").text() || $(".txt").text();
if(text && text.trim().length > 500){
let clean = text.trim().replace(/\n{3,}/g,"\n\n");
let parts=[];
for(let i=0;i<clean.length;i+=1800) parts.push(clean.substring(i,i+1800));
await message.reply(`📖 ${nameRaw.toUpperCase()} Ch.${chap}\nFrom: ${target}\n━━━━━━━━━━━━\n\n${parts[0]}`);
for(let i=1;i<parts.length;i++){ await new Promise(r=>setTimeout(r,500)); await message.reply(parts[i]); }
return;
}
}catch(e){ continue; }
}
return message.reply(`❌ Not found on novelfull. Try:\n!novel lord-of-the-mysteries ${chap}\nDirect link still works because proxy is fixed!`);
}
};
