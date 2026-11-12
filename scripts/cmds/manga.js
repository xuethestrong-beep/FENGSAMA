const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
config: {
name: "manga",
aliases: ["manhwa","manhua","manwa"],
version: "2.0-IMAGE-SEND",
author: "Feng",
role: 0,
category: "anime",
guide: "{pn} solo leveling 10"
},
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !manga solo leveling 5");

let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();
let PROXY = "https://fengbot-proxy.chekenwkx.workers.dev/?url=";

await message.reply(`📚 Loading ${nameRaw} ch.${chap} - sending pics...`);

try{
// Mangadex API
let sUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(nameRaw)}&limit=2`;
let {data: sData} = await axios.get(sUrl, {timeout:15000});
if(!sData.data || sData.data.length==0) throw new Error("not found manga");
let mangaId = sData.data[0].id;
let title = sData.data[0].attributes.title.en || nameRaw;

let cUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
let {data: cData} = await axios.get(cUrl, {timeout:15000});
let chapters = cData.data;
let found = chapters.find(c=> parseInt(c.attributes.chapter)==chap) || chapters[chap-1];
if(!found) throw new Error("chapter not found");

let chapId = found.id;
let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${chapId}`, {timeout:15000});
let host = server.baseUrl;
let hash = server.chapter.hash;
let pages = server.chapter.data.slice(0, 15); // send first 15 pages

let attachments = [];
for(let i=0;i<pages.length;i++){
let imgUrl = `${host}/data/${hash}/${pages[i]}`;
try{
let imgRes = await axios.get(imgUrl, {responseType:"stream", timeout:15000, headers:{"Referer":"https://mangadex.org/"}});
attachments.push(imgRes.data);
if(attachments.length==5) break; // send 5 at a time
}catch(e){}
}

if(attachments.length==0) return message.reply(`❌ No images for ${nameRaw} ch ${chap}`);

await api.sendMessage({
body: `📖 ${title} - Chapter ${chap}\nPage 1-${attachments.length}/${pages.length}\n━━━━━━━━━━━━`,
attachment: attachments
}, event.threadID);

if(pages.length>5){
await message.reply(`Send next 5? Reply: !manga ${nameRaw} ${chap} next (I can add auto next if you want)`);
}
return;
}catch(e){
return message.reply(`❌ Error: ${e.message}\nTry: !manga naruto 1\n!manga one piece 10`);
}
}
};
