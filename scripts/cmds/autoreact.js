module.exports = {
  config: {
    name: "autoreact",
    version: "4.0",
    author: "Cheken",
    countDown: 0,
    role: 0,
    shortDescription: "auto react 🐷 to all",
    longDescription: "auto react pig to all messages",
    category: "auto",
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const botID = api.getCurrentUserID();
    if (event.senderID == botID) return;

    // AUTO REACT 🐷 to EVERY message - ALWAYS ON
    try {
      api.setMessageReaction("🐷", event.messageID, (err) => {
        if (err) console.log(err);
      }, true);
    } catch (e) {
      console.log(e.message);
    }
  }
};
