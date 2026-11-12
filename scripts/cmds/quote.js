const axios = require("axios");
module.exports = {
  config: { name: "quote", version: "1.0", role: 0, category: "FUN" },
  onStart: async function({ api, event }){
    try{
      let res = await axios.get("https://api.quotable.io/random");
      api.sendMessage(`"${res.data.content}" — ${res.data.author}`, event.threadID);
    }catch{
      api.sendMessage("⚠️ This command is currently down at the moment. Please try again later.", event.threadID);
    }
  }
};
