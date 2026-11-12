const axios = require("axios");
module.exports = {
config: { name: "manga", aliases: ["manhwa","manhua","manwa"], version: "3.6-CLEAN-NO-SPAM", author: "Feng", role: 0, category: "anime", guide: "{pn} solo leveling 10" },
onStart: async function({ api, event, args, message }) {
let raw = args.join(" ").trim();
if(!raw) return message.reply("Usage: !manga solo leveling 5");
let chap = parseInt(raw.match(/(\d+)$/)?.[1] || 1);
let nameRaw = raw.replace(/\s*\d+\s*$/,"").toLowerCase().trim();
let map = {
"tensura":"tensei shitara slime datta ken",
"slime":"tensei shitara slime datta ken",
"that time i got reincarnated as slime":"tensei shitara slime datta ken",
"tensei shitara slime":"tensei shitara slime datta ken"
};
let searchName = map[nameRaw] || nameRaw;
try{
let sUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(searchName)}&limit=5&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&order[relevance]=desc`;
let {data: sData} = await axios.get(sUrl, {timeout:15000});
if(!sData.data || sData.data.length===0) return message.reply(`❌ Not found: ${nameRaw}`);
let best = sData.data[0];
let mangaId = best.id;
let title = best.attributes.title.en || Object.values(best.attributes.title)[0] || nameRaw;
let allChaps = [];
let offset = 0;
let foundChap = null;
for(let i=0; i<5; i++){
let cUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=${offset}&includeFutureUpdates=1`;
let {data: cData} = await axios.get(cUrl, {timeout:15000});
if(!cData.data || cData.data.length===0) break;
allChaps.push(...cData.data);
let f = cData.data.find(c=> c.attributes.chapter && parseInt(c.attributes.chapter)==chap);
if(f){ foundChap = f; break; }
if(cData.data.length < 500) break;
offset += 500;
}
if(!foundChap) foundChap = allChaps.find(c=> c.attributes.chapter && parseInt(c.attributes.chapter)==chap);
if(!foundChap) return message.reply(`❌ Chapter ${chap} not found`);
let {data: server} = await axios.get(`https://api.mangadex.org/at-home/server/${foundChap.id}`, {timeout:15000});
if(!server || !server.chapter || !server.chapter.data) return message.reply(`❌ No pages`);
let host = server.baseUrl, hash = server.chapter.hash, pages = server.chapter.data;
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
if(global.gc) global.gc();
await new Promise(r=>setTimeout(r,800));
}
}catch(e){
return message.reply(`❌ Error: ${e.message}`);
}
}
};
