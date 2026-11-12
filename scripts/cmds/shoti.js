const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: { name: "shoti", version: "15-KAIZ-DIRECT", author: "Feng", role: 0, category: "FUN" },
  onStart: async function({ api, event }){
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    
    const KAIZ_KEY = "2b4c1cba-ae42-4d18-8b9b-cd77c3cfcc3e";
    const API = `https://kaiz-apis.gleeze.com/api/shoti?apikey=${KAIZ_KEY}`;
    let maxTries = 3;

    for(let attempt = 1; attempt <= maxTries; attempt++){
      let filePath = path.join(cacheDir, `shoti_${Date.now()}_${attempt}.mp4`);
      try{
        let res = await axios.get(API, { timeout: 15000 });
        // Kaiz format is data.data.url
        let videoUrl = res.data?.data?.url || res.data?.url;
        let username = res.data?.data?.username || res.data?.username || "shoti";
        
        if(!videoUrl) throw new Error("No url from Kaiz");

        // Download
        let vid = await axios.get(videoUrl, { 
          responseType: "arraybuffer", 
          timeout: 30000,
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.tiktok.com/" }
        });
        let buffer = Buffer.from(vid.data);

        if(buffer.length > 26214400 || buffer.length < 5000){
          console.log(`Attempt ${attempt}: size ${(buffer.length/1024/1024).toFixed(1)}MB - skip`);
          continue;
        }

        fs.writeFileSync(filePath, buffer);

        await new Promise((resolve, reject)=>{
          api.sendMessage({ 
            body: `😍 @${username} | Try ${attempt}/${maxTries}`, 
            attachment: fs.createReadStream(filePath) 
          }, event.threadID, (err)=>{
            if(err) reject(err); else resolve();
          });
        });

        setTimeout(()=>{
          if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
        
        return; // Success

      }catch(e){
        if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.log(`Attempt ${attempt} failed: ${e.message}`);
        if(attempt === maxTries){
          return api.sendMessage(`❌ All ${maxTries} videos failed. Kaiz might be down. Try again. Error: ${e.message}`, event.threadID);
        }
        await new Promise(r=>setTimeout(r,1000));
      }
    }
  }
};
