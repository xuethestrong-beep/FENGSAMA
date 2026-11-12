const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4"]);

module.exports = {
  config: { name: "shoti", version: "18-SILENT-DOWN", author: "Feng", role: 0, category: "FUN" },
  onStart: async function({ api, event }){
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const API = `https://kaiz-apis.gleeze.com/api/shoti?apikey=2b4c1cba-ae42-4d18-8b9b-cd77c3cfcc3e`;

    for(let attempt=1; attempt<=3; attempt++){
      let filePath = path.join(cacheDir, `shoti_${Date.now()}_${attempt}.mp4`);
      try{
        let res = await axios.get(API, { timeout: 20000, family: 4 });
        let videoUrl = res.data?.data?.url || res.data?.url;
        let username = res.data?.data?.username || "shoti";
        if(!videoUrl) throw new Error();

        let vid = await axios.get(videoUrl, { 
          responseType: "arraybuffer", 
          timeout: 30000, 
          family: 4,
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.tiktok.com/" } 
        });

        let buffer = Buffer.from(vid.data);
        if(buffer.length > 26214400 || buffer.length < 5000) continue;

        fs.writeFileSync(filePath, buffer);
        await new Promise((resolve, reject)=>{
          api.sendMessage({ 
            body: `😍 @${username}`, 
            attachment: fs.createReadStream(filePath) 
          }, event.threadID, (err)=> err ? reject(err) : resolve());
        });
        setTimeout(()=>{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 5000);
        return;

      }catch(e){
        if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
        // silent retry, no text
      }
    }

    // All 3 failed -> same text as manga2
    return api.sendMessage("⚠️ This command is currently down at the moment. Please try again later.", event.threadID);
  }
};
