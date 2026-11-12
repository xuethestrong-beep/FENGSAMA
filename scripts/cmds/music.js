const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

async function handleMusic({ message, args, event, usersData }) {
  const stapi = new global.utils.STBotApis();
  if (!args[0]) return message.reply("🎵 Enter song name");
  
  let showList = false;
  if (args[0] === "-s") {
    showList = true;
    args.shift();
  }
  const query = args.join(" ");
  if (!query) return message.reply("❌ Enter song name");
  
  const processing = await message.reply(`⏳ Searching "${query}"...`);
  try {
    const search = await yts(query);
    if (!search.videos.length) {
      await message.unsend(processing.messageID);
      return message.reply("❌ No results found");
    }

    if (!showList) {
      const v = search.videos[0];
      await message.unsend(processing.messageID);
      const dlMsg = await message.reply(`⬇️ Processing: ${v.title}`);

      const step1 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: v.url });
      const formats = step1.data?.formats || [];
      let selected = formats.find(f => f.ext === "MP3") || formats.find(f => f.type === "Audio");
      
      if (!selected) {
        await message.unsend(dlMsg.messageID);
        return message.reply("❌ No audio format found");
      }

      const step2 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: v.url, formatUrl: selected.url });
      if (!step2.data?.downloadUrl) {
        await message.unsend(dlMsg.messageID);
        return message.reply("❌ Download failed");
      }

      const audio = await axios.get(step2.data.downloadUrl, { responseType: "arraybuffer" });
      const file = path.join(__dirname, "cache", `audio_${Date.now()}.mp3`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(audio.data));
      
      await message.unsend(dlMsg.messageID);
      await message.reply({ 
        body: `🎶 ${v.title}\n👤 ${v.author.name}\n⏱ ${v.timestamp}`, 
        attachment: fs.createReadStream(file) 
      });
      fs.unlinkSync(file);
      return;
    }

    const top = search.videos.slice(0, 6);
    let msg = `🔍 Results for "${query}"\n\n`;
    top.forEach((v, i) => {
      msg += `${i + 1}. ${v.title}\n⏱ ${v.timestamp}\n\n`;
    });
    msg += "👉 Reply with number";
    
    await message.unsend(processing.messageID);
    return message.reply(msg, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, { 
        commandName: module.exports.config.name, 
        author: event.senderID, 
        videos: top 
      });
    });

  } catch (e) {
    console.error(e);
    try { await message.unsend(processing.messageID); } catch {}
    return message.reply("❌ Error: " + e.message);
  }
}

module.exports = {
  config: {
    name: "music",
    aliases: ["song", "play"],
    version: "2.4.78-fixed",
    author: "ST | Sheikh Tamim - Fixed",
    role: 0,
    category: "music"
  },
  ST: handleMusic,
  onStart: handleMusic,
  onReply: async function ({ message, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return message.reply("⚠️ Not your request");
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) return message.reply("❌ Invalid choice");
    const stapi = new global.utils.STBotApis();
    const video = Reply.videos[choice - 1];
    const userName = await usersData.getName(event.senderID);
    const dlMsg = await message.reply(`⬇️ Processing: ${video.title}`);
    try {
      const step1 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: video.url });
      const formats = step1.data?.formats || [];
      let selected = formats.find(f => f.ext === "MP3") || formats.find(f => f.type === "Audio");
      if (!selected) {
        await message.unsend(dlMsg.messageID);
        return message.reply("❌ No audio format found");
      }
      const step2 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: video.url, formatUrl: selected.url });
      if (!step2.data?.downloadUrl) {
        await message.unsend(dlMsg.messageID);
        return message.reply("❌ Download failed");
      }
      const audio = await axios.get(step2.data.downloadUrl, { responseType: "arraybuffer" });
      const file = path.join(__dirname, "cache", `audio_${Date.now()}.mp3`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(audio.data));
      await message.unsend(dlMsg.messageID);
      await message.reply({ body: `🎶 ${video.title}\n👤 Requested by: ${userName}`, attachment: fs.createReadStream(file) });
      fs.unlinkSync(file);
    } catch (err) {
      console.error(err);
      try { await message.unsend(dlMsg.messageID); } catch {}
      return message.reply("❌ Download error");
    }
  }
};
