const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: { name: "welcome", version: "3.3-pic", author: "FENG", category: "events" },
  langs: {
    en: {
      botAdded: "%1 Connected successfully!",
      welcomeMessage: "Hi, {uName}\nWelcome to {threadName}\nYou're the {soThanhVien}th member!"
    }
  },
  onStart: async function ({ threadsData, event, api, getLang }) {
    if (event.logMessageType !== "log:subscribe") return;
    const { threadID } = event;
    const dataAddedParticipants = event.logMessageData.addedParticipants;

    if (dataAddedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      await api.sendMessage(getLang("botAdded", global.GoatBot.config.nickNameBot), threadID).catch(()=>{});
      return;
    }

    if (!global.temp.welcomeEvent[threadID]) global.temp.welcomeEvent[threadID] = { joinTimeout: null, participants: [] };
    global.temp.welcomeEvent[threadID].participants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
      try {
        const threadData = await threadsData.get(threadID);
        if (threadData.settings?.sendWelcomeMessage === false) return;
        const participants = global.temp.welcomeEvent[threadID].participants;
        global.temp.welcomeEvent[threadID].participants = [];

        const threadInfo = await api.getThreadInfo(threadID).catch(()=>({ threadName: "this group", participantIDs: [] }));
        const threadName = threadInfo.threadName || "this group";
        const totalMembers = threadInfo.participantIDs?.length || 0;

        const nameArray = [];
        const mentions = [];
        const memberNumbers = [];
        for (let idx = 0; idx < participants.length; idx++) {
          const p = participants[idx];
          if (p.userFbId == api.getCurrentUserID()) continue;
          nameArray.push((p.fullName || "Member").replace("@", ""));
          mentions.push({ tag: nameArray[nameArray.length-1], id: p.userFbId, fromIndex: 0 });
          memberNumbers.push(totalMembers - participants.length + idx + 1);
        }
        if (!nameArray.length) return;

        const msg = (threadData.data?.welcomeMessage || getLang("welcomeMessage"))
          .replace(/\{uName\}/g, nameArray.join(", "))
          .replace(/\{soThanhVien\}/g, memberNumbers.join(", "))
          .replace(/\{threadName\}/g, threadName);

        // AUTO-DETECT your welcome pic/vid
        const cacheDir = path.join(__dirname, "../cmds/cache");
        const eventCacheDir = path.join(__dirname, "cache");
        const names = ["welcome.jpg","welcome.jpeg","welcome.png","welcome.webp","welcome.gif","welcome.mp4","welcome.jpg","welcome.JPG","welcome.PNG"];
        const dirs = [eventCacheDir, cacheDir];
        let localFile = null;
        for (const dir of dirs) {
          for (const n of names) {
            const full = path.join(dir, n);
            if (await fs.pathExists(full)) { localFile = full; break; }
          }
          if (localFile) break;
        }

        if (localFile) {
          await api.sendMessage({ body: msg, attachment: fs.createReadStream(localFile), mentions }, threadID);
        } else {
          await api.sendMessage({ body: msg, mentions }, threadID);
        }
      } catch (e) { console.error("[welcome]", e.message); }
    }, 1500);
  }
};
