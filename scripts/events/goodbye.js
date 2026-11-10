const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "goodbye",
    version: "3.3 VIDEO ONLY",
    author: "FENG",
    category: "events"
  },

  onStart: async function () {},

  onEvent: async function ({ event, api }) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const threadID = event.threadID;
      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID || String(leftID) === String(api.getCurrentUserID())) return;

      const videoPath = path.join(__dirname, "cache", "goodbye.mp4");

      if (!fs.existsSync(videoPath)) {
        console.error("[GOODBYE] no video at cache/goodbye.mp4");
        return;
      }

      setTimeout(async () => {
        try {
          await api.sendMessage({ attachment: fs.createReadStream(videoPath) }, threadID);
        } catch (e) {
          console.error("[GOODBYE] Send Error:", e.message);
        }
      }, 800);

    } catch (e) {
      console.error("[GOODBYE]", e.message);
    }
  }
};
