module.exports = {
  config: {
    name: "checkJoin",
    version: "1.1",
    author: "FENG",
    countDown: 5,
    role: 0,
    description: "Auto-leave unapproved groups 60s after bot is added",
    category: "events",
    guide: "{pn}"
  },
  onEvent: async function ({ event, api, threadsData }) {
    try {
      if (event.logMessageType !== "log:subscribe") return;
      const added = event.logMessageData?.addedParticipants || [];
      const botID = api.getCurrentUserID();
      const isBotAdded = added.some(p => String(p.userFbId) === String(botID));
      if (!isBotAdded) return;
      const threadID = event.threadID;
      const threadInfo = await api.getThreadInfo(threadID).catch(() => null);
      const threadName = threadInfo?.threadName || "this group";
      const memberCount = threadInfo?.participantIDs?.length || null;
      const data = await threadsData.get(threadID) || {};
      if (data.isBanned) {
        try { await api.sendMessage(`❌ This group is banned. Leaving.`, threadID); } catch {}
        await api.removeUserFromGroup(botID, threadID).catch(() => {});
        return;
      }
      if (data.isApproved) {
        await api.sendMessage(`✅ Hello ${threadName}!\nThanks for adding me, I'm approved and ready!\nType !help to see commands.`, threadID).catch(() => {});
        return;
      }
      const memberLine = memberCount ? `\n👥 Members: ${memberCount}` : "";
      await api.sendMessage(
        `⚠️ Thanks for adding me to ${threadName}!\n\n🔒 This group is NOT approved yet.\n📝 GC ID: ${threadID}${memberLine}\n\nPlease contact bot admin to approve:\n!approveGC ${threadID}\n\nI will leave in 60 seconds if not approved.`,
        threadID
      ).catch(() => {});
      setTimeout(async () => {
        try {
          const check = await threadsData.get(threadID) || {};
          if (check.isApproved || check.isBanned) return;
          const stillThere = await api.getThreadInfo(threadID).catch(() => null);
          if (!stillThere) return;
          const stillMember = stillThere.participantIDs?.some(id => String(id) === String(botID));
          if (!stillMember) return;
          try { await api.sendMessage(`❌ Not approved, leaving ${threadName}. Add again after approval.`, threadID); } catch {}
          await api.removeUserFromGroup(botID, threadID).catch(() => {});
        } catch (e) {
          console.error("[CHECKJOIN] timer", e.message);
        }
      }, 60000);
    } catch (e) {
      console.error("[CHECKJOIN]", e.message);
    }
  }
};
