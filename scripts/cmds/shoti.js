const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
config: { name: "shoti", version: "11.0-FIX-UPLOAD", author: "Feng", role: 0, category: "FUN" },
onStart: async function({ api, event }){
let tmp = path.join(__dirname, "cache", `shoti_${Date.now()}.mp4`);
try{
let MY_API = "https://feng-shoti-api-production.up.railway.app/api/shoti";
let res = await axios.get(MY_API, {timeout:15000});
let url = res.data.url || res.data.data?.url;
if(!url) throw new Error("API no url");

// Download as buffer, not stream
let vid = await axios.get(url, {responseType:"arraybuffer", timeout:30000});
fs.ensureDirSync(path.join(__dirname, "cache"));
fs.writeFileSync(tmp, Buffer.from(vid.data));

api.sendMessage({
body: `😍 @${res.data.username || "shoti"}`,
attachment: fs.createReadStream(tmp)
}, event.threadID, (err)=>{
if(fs.existsSync(tmp)) fs.unlinkSync(tmp);
});

}catch(e){
if(fs.existsSync(tmp)) fs.unlinkSync(tmp);
api.sendMessage(`❌ Upload Fix Error: ${e.message}\nIf 408 error, refresh your appstate.json`, event.threadID);
}
}
};
