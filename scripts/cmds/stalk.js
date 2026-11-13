module.exports = {
config: { name: "stalk", version: "1.1", role: 0, category: "info" },
onStart: async function({ api, event, args, message }) {
let uid = Object.keys(event.mentions)[0] || event.messageReply?.senderID || args[0];
if (!uid) return message.reply("❌ Tag / Reply / UID");
try {
const info = await api.getUserInfo(uid);
const user = info[uid];
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const imgPath = path.join(__dirname, "cache", `${uid}.jpg`);
const res = await axios.get(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde566`, {responseType: "arraybuffer"});
fs.writeFileSync(imgPath, res.data);
return message.reply({
body: `👀 ${user.name}\nUID: ${uid}\nLink: ${user.profileUrl}\nGender: ${user.gender==2?"Male":"Female"}`,
attachment: fs.createReadStream(imgPath)
});
} catch(e){ return message.reply("❌ Failed: "+e.message); }
}
};
