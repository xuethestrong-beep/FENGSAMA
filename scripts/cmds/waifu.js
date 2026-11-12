const axios = require("axios");
module.exports = {
config: { name: "waifu", version: "3.0-DIRECT", author: "Feng", role: 0, category: "anime" },
onStart: async function({ api, event, args, message }) {
try{
let tag = args[0] || "waifu";
let res = await axios.get(`https://nekos.best/api/v2/waifu?amount=1`, {timeout:15000});
let url = res.data.results[0].url;
let img = await axios.get(url, {responseType:"stream", timeout:20000});
await api.sendMessage({ body: `✨ ${tag}`, attachment: img.data }, event.threadID);
}catch(e){ return message.reply("❌ Try: !waifu - API retrying"); }
}
};
