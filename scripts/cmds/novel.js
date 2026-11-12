const axios = require("axios");
const cheerio = require("cheerio");
module.exports = {
config: { name: "novel", aliases: ["read"], version: "6.0-NO-NOVELBIN", author: "Feng", role: 0, shortDescription: "Works for all", category: "books", guide: "{pn} martial peak 8" },
onStart: async function({ event, args, message }) {
if(!args[0]) return message.reply("Use: !novel martial peak 8");
let raw = args.join(" ");
let chap = parseInt(raw.match(/(\d+)\s*$/i)?.[1] || 1);
let name = raw.replace(/(?:chap|chapter|c)\s*\d+\s*$/i,"").replace(/\s*\d+\s*$/,"").trim().toLowerCase();
let slug = name.replace(/[^a-z0-9]+/g,"-");
message.reply(`📚 Reading ${name} ${chap}... [fast]`);

async function get(url, sels){
try{
let {data} = await axios.get(url, {timeout: 8000, headers: {"User-Agent":"Mozilla/5.0"}});
const $ = cheerio.load(data);
for(let s of sels){
let t = $(s).text();
if(t && t.length > 500) return t.replace(/\s+/g," ").trim();
}
}catch(e){ console.log("fail",url); }
return null;
}

let text = null;
// Try Asura first - works for BOTH RI and Martial Peak
text = await get(`https://asurascans.com/${slug}-chapter-${chap}`, [".chapter-content",".entry-content","article","#content"]);
if(!text) text = await get(`https://novelsonline.org/${slug}/chapter-${chap}`, [".chapter-content","#chapter-content","article"]);
if(!text) text = await get(`https://novelbuddy.com/novel/${slug}/chapter-${chap}`, ["#chr-content",".chapter-content"]);
if(!text) text = await get(`https://readnovelfull.com/${slug}/chapter-${chap}.html`, [".chapter-content"]);

if(!text) return message.reply(`❌ v6 also blocked - your BOT SERVER IP is blocked.\n\nFix: Your hosting (Railway/Replit) is blocked by novel sites.\nSolution: Change to use ARCHIVE.ORG which never blocks.\nTry: !novel reverend insanity 1 should work via archive next version.`);

let parts = [];
for(let i=0;i<text.length;i+=1800) parts.push(text.substring(i,i+1800));
await message.reply(`📖 ${name.toUpperCase()} - Chap ${chap}\n━━━━━━━━━━━━━━\n\n`+parts[0]);
for(let i=1;i<parts.length;i++){ await new Promise(r=>setTimeout(r,600)); await message.reply(parts[i]); }
await message.reply(`✅ End Chap ${chap} | Next: !novel ${name} ${chap+1}`);
}
};
