module.exports = {
  config: {
    name: "goodbye",
    version: "2.2 NOVID TEXT",
    author: "FENG",
    category: "events",
  },
  onStart: async function ({ message, event, args, threadsData }) {
    const data = await threadsData.get(event.threadID) || {};
    const settings = data.settings || {};
    const type = (args[0] || "").toLowerCase();
    if (!["on","off"].includes(type)) {
      return message.reply(`👋 GOODBYE: ${settings.goodbye ? "ON ✅" : "OFF ❌"}\n\ngoodbye on/off`);
    }
    settings.goodbye = type === "on";
    await threadsData.set(event.threadID, { ...data, settings });
    return message.reply(type === "on" ? "✅ Goodbye ON (video only)" : "❌ Goodbye OFF");
  },
  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType !== "log:unsubscribe") return;
    const threadID = event.threadID;
    const data = await threadsData.get(threadID) || {};
    if (!data.settings?.goodbye) return;
    const leftID = event.logMessageData?.leftParticipantFbId;
    if (!leftID || String(leftID) === String(api.getCurrentUserID())) return;
    const fs = require("fs");
    const path = require("path");
    const videoPath = path.join(__dirname, "cache", "goodbye.mp4");
    if (!fs.existsSync(videoPath)) return;
    try {
      await api.sendMessage({
        attachment: fs.createReadStream(videoPath)
      }, threadID);
    } catch (e) {
      console.error("[GOODBYE]", e.message);
    }
  }
};
