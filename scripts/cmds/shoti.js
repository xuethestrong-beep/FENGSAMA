const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
config: { name: "shoti", version: "14-AUTO-RETRY", author: "Feng", role: 0, category: "FUN" },

onStart: async function({ api, event }){
const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

let API = "https://feng-shoti-api-production.up.railway.app/api/shoti";
let maxTries = 3;

for(let attempt = 1; attempt <= maxTries; attempt++){
let filePath = path.join(cacheDir, `shoti_${Date.now()}_${attempt}.mp4`);
try{
 let res = await axios.get(API, { timeout: 15000 });
 let videoUrl = res.data.url;
 let username = res.data.username || "shoti";
 if(!videoUrl) continue;

 // Download
 let vid = await axios.get(videoUrl, { responseType: "arraybuffer", timeout: 30000 });
 let buffer = Buffer.from(vid.data);

 // Skip if too big - try next
 if(buffer.length > 26214400 || buffer.length < 5000){
  console.log(`Attempt ${attempt}: size ${(buffer.length/1024/1024).toFixed(1)}MB - skip`);
  continue;
 }

 fs.writeFileSync(filePath, buffer);

 // Upload
 await new Promise((resolve, reject)=>{
  api.sendMessage({
   body: `😍 @${username} | Try ${attempt}/${maxTries}`,
   attachment: fs.createReadStream(filePath)
  }, event.threadID, (err)=>{ if(err) reject(err); else resolve(); });
 });

 setTimeout(()=>{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 5000);
 return; // Success, stop loop

}catch(e){
 if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
 console.log(`Attempt ${attempt} failed: ${e.message}`);
 // If last attempt, show error
 if(attempt === maxTries){
  return api.sendMessage(`❌ All ${maxTries} videos failed (FB Mercury bug). Type !shoti again. Error: ${e.message}`, event.threadID);
 }
 // else try next video
 await new Promise(r=>setTimeout(r,1000));
}
}
}
};
