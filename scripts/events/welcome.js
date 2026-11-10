const fs = require("fs");
const path = require("path");
module.exports = {
  config: { name: "welcome", version: "3.4 PIC", author: "FENG", category: "events" },
  onStart: async () => {},
  onEvent: async ({ event, api }) => {
    try {
      if (event.logMessageType !== "log:subscribe") return;
      const added = event.logMessageData?.addedParticipants || [];
      if (added.some(u => String(u.userFbId) === String(api.getCurrentUserID()))) return;
      if (!added.length) return;
      const threadID = event.threadID;
      const picPath = path.join(__dirname, "cache", "welcome.jpg");
      const picPng = path.join(__dirname, "cache", "welcome.png");
      let file = fs.existsSync(picPath) ? picPath : fs.existsSync(picPng) ? picPng : null;
      if (!file) return console.error("[WELCOME] no pic at cache/welcome.jpg");
      setTimeout(async () => {
        try { await api.sendMessage({ attachment: fs.createReadStream(file) }, threadID); } catch (e) { console.error("[WELCOME]", e.message); }
      }, 1000);
    } catch (e) { console.error("[WELCOME]", e.message); }
  }
};
