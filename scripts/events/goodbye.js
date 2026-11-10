const fs = require("fs");
const path = require("path");
module.exports = {
  config: {
    name: "goodbye",
    version: "2.4 NO TEXT",
    author: "FENG",
    countDown: 3,
    role: 1,
    description: "Goodbye video only when someone leaves or gets kicked",
    category: "events",
    guide: "{pn} on\n{pn} off"
  },
  onStart: async function ({ message, event, args, threadsData }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      const settings = data.settings || {};
      const type = (args?.[0] || "").toLowerCase();
      if (!["on", "off"].includes(type)) {
        return message.reply(`👋 GOODBYE: ${settings.goodbye ? "ON ✅" : "OFF ❌"}\n\ngoodbye on/off`);
      }
      settings.goodbye = type === "on";
      await threadsData.set(threadID, { ...data, settings });
      return message.reply(type === "on" ? "✅ Goodbye ON (video only)" : "❌ Goodbye OFF");
    } catch (e) {
      console.error("[GOODBYE] onStart", e.message);
      return message.reply("❌ Failed");
    }
  },
  onEvent: async function ({ event, api, threadsData }) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      if (!data.settings?.goodbye) return;
      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID || String(leftID) === String(api.getCurrentUserID())) return;

      const videoPath = path.join(__dirname, "cache", "goodbye.mp4");
      const imagePath = path.join(__dirname, "cache", "goodbye.jpg");

      setTimeout(async () => {
        try {
          let attachment = null;
          if (fs.existsSync(videoPath)) attachment = fs.createReadStream(videoPath);
          else if (fs.existsSync(imagePath)) attachment = fs.createReadStream(imagePath);
          if (!attachment) return;
          await api.sendMessage({ attachment }, threadID);
        } catch (e) {
          console.error("[GOODBYE] Send Error:", e.message);
        }
      }, 500);
    } catch (e) {
      console.error("[GOODBYE] onEvent", e.message);
    }
  }
};
