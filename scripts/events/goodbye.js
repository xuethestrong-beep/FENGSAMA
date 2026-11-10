const fs = require("fs");
const path = require("path");
const { getTime } = global.utils;

module.exports = {
  config: {
    name: "goodbye",
    version: "3.1 ALWAYS ON",
    author: "FENG",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      leaveType1: "left",
      leaveType2: "was kicked from",
      defaultLeaveMessage: "{userName} {type} the group - GOODBYE"
    }
  },

  onStart: async function () {}, // No command, always on

  onEvent: async function ({ event, api, threadsData, usersData, getLang }) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const threadID = event.threadID;
      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID || String(leftID) === String(api.getCurrentUserID())) return;

      const threadData = await threadsData.get(threadID) || {};
      const threadName = threadData.threadName || "group";
      const hours = getTime("HH");
      const userName = await usersData.getName(leftID).catch(() => "Someone");

      const isKick = String(event.author) !== String(leftID);
      let msg = getLang("defaultLeaveMessage")
        .replace(/\{userName\}/g, userName)
        .replace(/\{type\}/g, isKick ? getLang("leaveType2") : getLang("leaveType1"))
        .replace(/\{threadName\}|\{boxName\}/g, threadName)
        .replace(/\{time\}/g, hours)
        .replace(/\{session\}/g, hours <= 10 ? getLang("session1") : hours <= 12 ? getLang("session2") : hours <= 18 ? getLang("session3") : getLang("session4"));

      const form = { body: msg };

      const videoPath = path.join(__dirname, "cache", "goodbye.mp4");
      const imagePath = path.join(__dirname, "cache", "goodbye.jpg");

      if (fs.existsSync(videoPath)) form.attachment = fs.createReadStream(videoPath);
      else if (fs.existsSync(imagePath)) form.attachment = fs.createReadStream(imagePath);

      setTimeout(() => api.sendMessage(form, threadID), 800);

    } catch (e) {
      console.error("[GOODBYE]", e.message);
    }
  }
};
