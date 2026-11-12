const axios = require("axios");
module.exports = {
  config: { name: "philosophy", version: "1.0", role: 0, category: "FUN" },
  onStart: async function({ api, event, message }){
    try{
      let res = await axios.get("https://api.quotable.io/random?tags=philosophy", { timeout: 8000 });
      return message.reply(`"${res.data.content}" — ${res.data.author}`);
    }catch{
      return message.reply("⚠️ This command is currently down at the moment. Please try again later.");
    }
  }
};
