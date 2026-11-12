const axios = require("axios");
module.exports = {
config: { 
name: "shoti", 
aliases: ["shotii","girl"], 
version: "10.0-FINAL-MY-API", 
author: "Feng", 
role: 0, 
category: "FUN", 
guide: "{pn}" 
},
onStart: async function({ api, event }){
try{
let MY_API = "https://feng-shoti-api-production.up.railway.app/api/shoti";

let res = await axios.get(MY_API, {timeout:15000});
let url = res.data.url || res.data.data?.url;
let username = res.data.username || "feng";

if(!url) throw new Error("No URL from API");

let stream = await axios.get(url, {responseType:"stream", timeout:25000, headers: {"User-Agent":"Mozilla/5.0"}});

api.sendMessage({
body: `😍 @${username}\nYour Own API ✅`,
attachment: stream.data
}, event.threadID);

}catch(e){
api.sendMessage(`❌ Error: ${e.message}\nTry again, Railway waking up (20s)`, event.threadID);
}
}
};
