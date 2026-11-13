const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "waifu18",
    aliases: ["w18", "nsfwwaifu"],
    version: "1.0-RAILWAY",
    author: "Feng",
    role: 0,
    category: "nsfw",
    guide: "{pn} | {pn} neko | {pn} waifu"
  },
  onStart: async function({ api, event, args, message }) {
    const nsfwPath = path.join(__dirname, "cache", "nsfw.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(nsfwPath)) fs.writeJsonSync(nsfwPath, {});
    if (!fs.readJsonSync(nsfwPath)[event.threadID]) return message.reply("❌ NSFW OFF\n!nsfw on");

    let tag = args[0] || "waifu";
    if (!["waifu", "neko", "trap", "blowjob"].includes(tag)) tag = "waifu";

    try {
      await message.reply(`🔞 Loading ${tag}...`);

      // waifu.im API - never blocked
      let { data } = await axios.get(`https://api.waifu.im/search?included_tags=${tag}&is_nsfw=true`, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!data.images || data.images.length === 0) {
        // fallback to waifu.pics
        let r2 = await axios.get(`https://api.waifu.pics/nsfw/${tag}`, { timeout: 10000 });
        data = { images: [{ url: r2.data.url }] };
      }

      let imgUrl = data.images[0].url;
      let filePath = path.join(__dirname, "cache", `w18_${Date.now()}.jpg`);
      
      let proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imgUrl.replace(/^https?:\/\//, ""))}`;
      let res = await axios.get(proxyUrl, { responseType: "arraybuffer", timeout: 20000 });
      fs.writeFileSync(filePath, Buffer.from(res.data));

      await api.sendMessage({
        body: `🔞 ${tag} | ${data.images[0].source || ""}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (e) {
      return message.reply(`❌ Failed: ${e.message}`);
    }
  }
};
