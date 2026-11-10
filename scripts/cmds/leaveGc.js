module.exports = {
  config: {
    name: "leaveGC",
    version: "1.1",
    author: "FENG",
    countDown: 3,
    role: 2,
    description: "Leave a GC",
    category: "admin",
    guide: "{pn} <threadID>"
  },
  onStart: async function ({ message, args, event, api, threadsData }) {
    try {
      const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
      const tid = String(args[0] || "").trim();
      if (!tid) return message.reply(`Usage: ${prefix}leaveGC <threadID>\nGet ID from ${prefix}gclist`);
      if (!/^\d+$/.test(tid)) return message.reply("❌ Invalid ThreadID. Must be numbers only.");
      const botID = api.getCurrentUserID();
      const info = await api.getThreadInfo(tid).catch(() => null);
      if (!info) return message.reply(`❌ Group ${tid} not found / bot is not in it.`);
      const isInGroup = !!info.participantIDs?.some(id => String(id) === String(botID));
      if (!isInGroup) return message.reply(`❌ Bot is not in ${tid} (${info.threadName || "Unnamed"}).`);
      const isCurrentGroup = String(tid) === String(event.threadID);
      try {
        await api.sendMessage(`👋 Bot admin left this group via command.\nGC ID: ${tid}`, tid);
      } catch (e) {
        console.error("[LEAVEGC] goodbye", e.message);
      }
      await api.removeUserFromGroup(botID, tid).catch((e) => { throw e; });
      try {
        const data = await threadsData.get(tid).catch(() => null) || {};
        await threadsData.set(tid, { ...data, threadID: tid, threadName: info.threadName || data.threadName || "Unnamed", isApproved: false, approvedAt: null });
      } catch (e) {
        console.error("[LEAVEGC] set", e.message);
      }
      if (isCurrentGroup) {
        return;
      }
      return message.reply(`✅ Left GC ${tid} (${info.threadName || "Unnamed"})`);
    } catch (e) {
      console.error("[LEAVEGC]", e);
      return message.reply(`❌ Failed to leave: ${e.message}\nBot may not be in that GC.`);
    }
  }
};
