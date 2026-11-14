module.exports = {
  config: {
    name: "haha",
    aliases: ["happy"],
    version: "1.0",
    author: "FengSama",
    role: 0, // all can trigger
    countDown: 2,
    category: "fun"
  },
  
  onStart: async function ({ message }) {
    message.reply("😆 haha detector is ON!\nIf someone says haha/hahaha → bot will react 😆 and say 'happy yarn?'");
  },

  onChat: async function ({ api, event }) {
    try {
      if (!event.body) return;
      const text = event.body.toLowerCase();

      // Detect haha, hahaha, hahahahha, hehe, etc
      if (text.includes("haha") || text.includes("hahaha") || text.includes("hahah")) {
        // 1. React 😆
        api.setMessageReaction("😆", event.messageID, () => {}, true);
        
        // 2. Reply "happy yarn?"
        api.sendMessage("happy yarn? ", event.threadID, event.messageID);
      }
    } catch {}
  }
};
