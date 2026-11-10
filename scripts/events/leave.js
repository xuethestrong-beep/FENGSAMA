const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: { name: "leave", version: "3.4-no-link", author: "FENG", category: "events" },
  onStart: async function ({ threadsData, event, api, usersData }) {
    if (event.logMessageType !== "log:unsubscribe") return;
    const { threadID } = event;
    try {
      const threadData = await threadsData.get(threadID);
      if (threadData.settings?.sendLeaveMessage === false) return;

      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID || String(leftID) === String(api.getCurrentUserID())) return;

      const userName = await usersData.getName(leftID).catch(()=> "Someone");
      const leaveMsg = `bye ${userName}, NIGGA`;

      const paths = [
        path.join(__dirname, "cache", "leave.mp4"),
        path.join(__dirname, "../cmds/cache/leave.mp4"),
        path.join(__dirname, "cache", "leave.gif"),
      ];
      let file = null;
      for (const p of paths) if (await fs.pathExists(p)) { file = p; break; }

      if (file) {
        await api.sendMessage({ body: leaveMsg, attachment: fs.createReadStream(file) }, threadID);
      } else {
        await api.sendMessage(leaveMsg, threadID);
      }
    } catch (e) { console.error("[leave]", e.message); }
  }
};
