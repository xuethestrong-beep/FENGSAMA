const axios = require("axios");

module.exports = {
config: {
name: "manga",
aliases: ["manhwa","manhua","manwa"],
version: "3.0-ALL-PAGES",
author: "Feng",
role: 0,
category: "anime",
guide: "{pn} solo leveling 10 | {pn} naruto 1"
},
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !manga solo leveling 5\n!manga naruto 1");

let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();

await message.reply(`📚 Loading ALL pages for ${nameRaw} ch.${chap}...\nThis may take 20 sec`);

try{
let sUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(nameRaw)}&limit=3`;
let {data: sData} = await axios.get(sUrl, {timeout:15000});
if(!sData.data.length) return message.reply(`❌ Manga not found: ${nameRaw}\nTry: !manga solo leveling\n!manga naruto`);
let mangaId = sData.data[0].id;
let title = sData.data[0].attributes.title.en || sData.data[0].attributes.title[Object.keys(sData.data[0].attributes.title)[0]] || nameRaw;

let cUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
let {data: cData} = await axios.get(cUrl, {timeout:15000});
let chapters = cData.data;
let found = chapters.find(c=> parseInt(c.attributes.chapter)==chap);
if(!found) found = chapters.find(c=> c.attributes.chapter==String(chap)) || chapters[chap-1];
if(!found) return message.reply(`❌ Chapter ${chap} not found for ${nameRaw}. Found ${chapters.length} chapters total.`);

let chapId = found.id;
let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${chapId}`, {timeout:15000});
let host = server.baseUrl;
let hash = server.chapter.hash;
let pages = server.chapter.data; // ALL pages

await message.reply(`📖 ${title.toUpperCase()} - Chapter ${chap}\nTotal: ${pages.length} pages\nSending in batches of 5...`);

for(let batchStart=0; batchStart<pages.length; batchStart+=5){
let batch = pages.slice(batchStart, batchStart+5);
let attachments = [];
for(let fileName of batch){
let imgUrl = `${host}/data/${hash}/${fileName}`;
try{
let imgRes = await axios.get(imgUrl, {responseType:"stream", timeout:20000, headers:{"Referer":"https://mangadex.org/"}});
attachments.push(imgRes.data);
}catch(e){}
}
if(attachments.length>0){
await api.sendMessage({
body: `📖 ${title} Ch.${chap} [${batchStart+1}-${Math.min(batchStart+5,pages.length)}/${pages.length}]`,
attachment: attachments
}, event.threadID);
await new Promise(r=>setTimeout(r,1500));
}
}
await message.reply(`✅ Done! ${title} Chapter ${chap} - ${pages.length} pages sent.`);

}catch(e){
return message.reply(`❌ Error: ${e.message}\nTry: !manga one piece 1`);
}
}
};
