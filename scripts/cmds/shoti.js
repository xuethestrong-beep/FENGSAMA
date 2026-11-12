const axios = require("axios");
module.exports = {
config: { name: "shoti", version: "3.0-NEWAPI", author: "Feng", role: 0, category: "fun" },
onStart: async function({ api, event }) {
try{
let {data} = await axios.get("https://shoti.kenliejugarap.com/api/v1/request/f?apikey=kenlie-apikey", {timeout:20000});
let url = data.data || data.url || data.shoti;
if(!url) throw new Error("no url");
let vid = await axios.get(url, {responseType:"stream", timeout:30000});
await api.sendMessage({ body: `💃 Shoti`, attachment: vid.data }, event.threadID);
}catch(e){
try{
let {data} = await axios.get("https://api.kenliejugarap.com/shoti/", {timeout:20000});
let url = data.data?.shoti || data.shoti;
let vid = await axios.get(url, {responseType:"stream"});
await api.sendMessage({ attachment: vid.data }, event.threadID);
}catch(err){ return api.sendMessage("❌ Shoti API sleeping, try after 2 mins", event.threadID); }
}
}
};
