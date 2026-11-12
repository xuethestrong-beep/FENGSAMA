const axios = require("axios");

module.exports = {
config: { name: "manga", aliases: ["manhwa","manhua","manwa"], version: "3.1-CLEAN-RAM", author: "Feng", role: 0, category: "anime", guide: "{pn} solo leveling 10" },
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !manga solo leveling 5");
let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();
await message.reply(`📚 Loading ALL pages for ${nameRaw} ch.${chap}...`);

try{
let sUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(nameRaw)}&limit=3`;
let {data: sData} = await axios.get(sUrl, {timeout:15000});
if(!sData.data.length) return message.reply(`❌ Not found: ${nameRaw}`);
let mangaId = sData.data[0].id;
let title = sData.data[0].attributes.title.en || nameRaw;
let cUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
let {data: cData} = await axios.get(cUrl, {timeout:15000});
let found = cData.data.find(c=> parseInt(c.attributes.chapter)==chap) || cData.data[chap-1];
if(!found) return message.reply(`❌ Chapter ${chap} not found`);
let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${found.id}`, {timeout:15000});
let host = server.baseUrl, hash = server.chapter.hash, pages = server.chapter.data;
await message.reply(`📖 ${title} Ch.${chap} - Total ${pages.length} pages`);

for(let start=0; start<pages.length; start+=5){
let batch = pages.slice(start, start+5);
let attachments = [];
for(let f of batch){
try{
let r = await axios.get(`${host}/data/${hash}/${f}`, {responseType:"stream", timeout:20000, headers:{"Referer":"https://mangadex.org/"}});
attachments.push(r.data);
}catch(e){}
}
if(attachments.length>0){
await api.sendMessage({ body: `📖 ${title} Ch.${chap} [${start+1}-${Math.min(start+5,pages.length)}/${pages.length}]`, attachment: attachments }, event.threadID);
}
// CLEAN RAM AFTER EACH BATCH
attachments = null;
if(global.gc) global.gc();
await new Promise(r=>setTimeout(r,1200));
}
await message.reply(`✅ Done! ${title} Ch.${chap} - ${pages.length} pages - Cache cleared!`);
}catch(e){ return message.reply(`❌ Error: ${e.message}`); }
}
};
