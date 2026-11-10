const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: { name: "welcome", version: "3.2-no-link", author: "FENG", category: "events" },
  langs: {
    en: {
      botAdded: "%1 Connected successfully!",
      welcomeMessage: "BONJOUR!, {uName}\nWelcome to {threadName}\nYou're the {soThanhVien}th member! 🥳♥"
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
          const name = (p.fullName || "Member").replace("@", "");
          nameArray.push(name);
          mentions.push({ tag: name, id: p.userFbId, fromIndex: 0 });
          memberNumbers.push(totalMembers - participants.length + idx + 1);
        }
        if (!nameArray.length) return;

        const customMsg = threadData.data?.welcomeMessage;
        const msg = (customMsg || getLang("welcomeMessage"))
          .replace(/\{uName\}/g, nameArray.join(", "))
          .replace(/\{soThanhVien\}/g, memberNumbers.join(", "))
          .replace(/\{threadName\}/g, threadName);

        const cacheDir = path.join(__dirname, "../cmds/cache");
        const eventCacheDir = path.join(__dirname, "cache");
        const localPaths = [
          path.join(eventCacheDir, "welcome.mp4"),
          path.join(cacheDir, "welcome.mp4"),
          path.join(cacheDir, "welcome.gif"),
        ];
        let localFile = null;
        for (const lp of localPaths) if (await fs.pathExists(lp)) { localFile = lp; break; }

        if (localFile) {
          await api.sendMessage({ body: msg, attachment: fs.createReadStream(localFile), mentions }, threadID);
        } else {
          await api.sendMessage({ body: msg, mentions }, threadID);
        }
      } catch (e) { console.error("[welcome]", e.message); }
    }, 1500);
  }
};
