module.exports = {
  config: {
    name: "antiout",
    version: "2.3 FORCED",
    author: "FENG",
    countDown: 3,
    role: 2,
    description: "Forced antiout - adds back EVERYONE, even voluntary leave",
    category: "box",
    guide: "{pn} on\n{pn} off"
  },

  onStart: async function ({ message, event, args, threadsData }) {
    try {
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      const settings = data.settings || {};
      const type = (args[0] || "").toLowerCase();

      if (!["on","off"].includes(type)) {
        const status = settings.antiout ? "ON ✅ FORCED" : "OFF ❌";
        return message.reply(
          `🚪 ANTIOUT: ${status}\n\n`+
          `FORCED: adds back kicked AND voluntary leave\n`+
          `Usage: antiout on / off`
        );
      }

      settings.antiout = type === "on";
      await threadsData.set(threadID, { ...data, settings });

      return message.reply(type === "on" ? `✅ Antiout ON - FORCED\nEveryone who leaves will be added back` : `❌ Antiout OFF`);

    } catch (e) {
      return message.reply("❌ Failed");
    }
  },

  onEvent: async function ({ event, threadsData, api, usersData }) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;
      const threadID = event.threadID;
      const data = await threadsData.get(threadID) || {};
      if (!data.settings?.antiout) return;

      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID) return;
      const botID = api.getCurrentUserID();
      if (String(leftID) === String(botID)) return;

      const author = event.author;
      if (String(author) === String(botID)) return;

      // Only bot admin can make someone stay out
      const botAdmins = global.GoatBot?.config?.adminBot || [];
      if (botAdmins.some(a => String(a) === String(author))) return;

      // REMOVED the voluntary check - now even self-leave adds back
      const name = await usersData.getName(leftID).catch(() => "User");
      
      setTimeout(async () => {
        try {
          await api.addUserToGroup(leftID, threadID);
          await api.sendMessage(`🚪 ${name} left but antiout FORCED is ON - added back!`, threadID);
        } catch (err) {
          await api.sendMessage(`⚠️ Couldn't add ${name} back - bot not admin or blocked`, threadID).catch(()=>{});
        }
      }, 1000);

    } catch (e) {
      console.error("[ANTIOUT] Error:", e.message);
    }
  }
};
