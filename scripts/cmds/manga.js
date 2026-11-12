const axios = require("axios");
module.exports = {
config: { name: "manga", aliases: ["manhwa"], version: "4.1-SAFE-30", author: "Feng", role: 0, category: "anime" },
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
let parts = raw.split(" ");
let last = parts[parts.length-1];
let range = last.includes("-") ? last : null;
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let nameRaw = raw.replace(/(\d+-\d+|\d+)\s*$/i,"").trim().toLowerCase();
if(!nameRaw) return message.reply("Usage: !manga the servant is the demon king 10\nFor long chapter: !manga the servant is the demon king 10 1-30");

// DEFAULT: only send first 30 to avoid crash
let startPage = 1, endPage = 30;
if(range){
let [s,e] = range.split("-").map(n=>parseInt(n));
startPage = s||1; endPage = e||30;
}
if(endPage - startPage > 40) endPage = startPage + 29; // max 30 pages

await message.reply(`📚 Loading ch.${chap} pages ${startPage}-${endPage} (to prevent bot die)`);

try{
let {data: sData} = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(nameRaw)}&limit=3`, {timeout:15000});
let mangaId = sData.data[0].id;
let title = sData.data[0].attributes.title.en || nameRaw;
let {data: cData} = await axios.get(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`, {timeout:15000});
let found = cData.data.find(c=> parseInt(c.attributes.chapter)==chap) || cData.data[chap-1];
let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${found.id}`, {timeout:15000});
let host = server.baseUrl, hash = server.chapter.hash, allPages = server.chapter.data;
let pages = allPages.slice(startPage-1, endPage);

for(let i=0;i<pages.length;i+=5){
let batch = pages.slice(i,i+5);
let attachments = [];
for(let f of batch){
let r = await axios.get(`${host}/data/${hash}/${f}`, {responseType:"stream", timeout:15000, headers:{"Referer":"https://mangadex.org/"}});
attachments.push(r.data);
}
await api.sendMessage({ body: `📖 ${title} Ch.${chap} [${startPage+i}-${Math.min(startPage+i+4,endPage)}/${allPages.length}]`, attachment: attachments }, event.threadID);
attachments = null;
await new Promise(r=>setTimeout(r,4000));
}
await message.reply(`✅ Done ${startPage}-${endPage}/${allPages.length}\nTo read next: !manga ${nameRaw} ${chap} ${endPage+1}-${endPage+30}\n\nRAM cleared!`);
}catch(e){ return message.reply(`❌ ${e.message}`); }
}
};
