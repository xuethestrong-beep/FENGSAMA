const axios = require("axios");

module.exports = {
  config: { name: "advice", version: "1.0", author: "Feng", role: 0, category: "FUN" },
  onStart: async function({ api, event, args }){
    let limit = parseInt(args[0]) || 1;
    if(limit > 20) limit = 20;

    try{
      for(let i=0; i<limit; i++){
        let res = await axios.get("https://api.adviceslip.com/advice", { timeout: 8000 });
        let advice = res.data.slip.advice;
        await api.sendMessage(`💡 ${advice}`, event.threadID);
        if(limit > 1) await new Promise(r=>setTimeout(r, 700));
      }
    }catch(e){
      return api.sendMessage("⚠️ This command is currently down at the moment. Please try again later.", event.threadID);
    }
  }
};
