module.exports = {
  config: {
    name: "approveGC",
    version: "1.1",
    author: "FENG",
    countDown: 3,
    role: 2,
    description: "Approve group",
    category: "admin",
    guide: "{pn} <threadID> | {pn} list | {pn} remove <threadID>"
  },
  onStart: async function ({ message, args, threadsData, api }) {
    try {
      const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
      const cmd = String(args[0] || "").toLowerCase();
      if (cmd === "list" || !args[0]) {
        const raw = await threadsData.getAll().catch(() => []);
        const all = Array.isArray(raw) ? raw : Object.values(raw || {});
        const approved = all.filter(t => t.isApproved).sort((a, b) => String(a.threadName || "").localeCompare(String(b.threadName || "")));
        if (!approved.length) return message.reply("📋 Approved GCs: 0\n\nNo approved GCs yet.");
        let page = 1;
        if (/^\d+$/.test(cmd) && cmd !== "list") page = parseInt(cmd, 10);
        else if (args[1] && /^\d+$/.test(args[1])) page = parseInt(args[1], 10);
        const perPage = 10;
        const totalPages = Math.ceil(approved.length / perPage);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        const slice = approved.slice((page - 1) * perPage, page * perPage);
        let msg = `📋 Approved GCs: ${approved.length} - Page ${page}/${totalPages}\n\n`;
        slice.forEach((t, i) => {
          const members = t.participantIDs?.length ?? t.members ?? "?";
          msg += `${(page - 1) * perPage + i + 1}. ${t.threadName || "Unnamed"} | ${t.threadID} | ${members} members\n`;
        });
        msg += `\nUse ${prefix}approveGC list <page> for more`;
        return message.reply(msg);
      }
      if (cmd === "remove" || cmd === "disapprove") {
        const tid = String(args[1] || "").trim();
        if (!/^\d+$/.test(tid)) return message.reply(`Usage: ${prefix}approveGC remove <threadID>`);
        const data = await threadsData.get(tid).catch(() => null) || {};
        await threadsData.set(tid, { ...data, threadID: tid, isApproved: false, approvedAt: null });
        const botID = api.getCurrentUserID();
        let wasInGroup = false;
        try {
          const info = await api.getThreadInfo(tid);
          wasInGroup = !!info?.participantIDs?.some(id => String(id) === String(botID));
        } catch {}
        if (wasInGroup) {
          try { await api.sendMessage(`❌ This group was disapproved by admin. Leaving.`, tid); } catch {}
          await api.removeUserFromGroup(botID, tid).catch(() => {});
          return message.reply(`❌ Disapproved ${tid} and left the group.`);
        }
        return message.reply(`❌ Disapproved ${tid}, bot will leave if added.`);
      }
      const threadID = String(args[0] || "").trim();
      if (!/^\d+$/.test(threadID)) return message.reply("Invalid ThreadID. Get it from when bot was added.");
      const info = await api.getThreadInfo(threadID).catch(() => null);
      if (!info) return message.reply(`❌ Group ${threadID} not found / bot is not in it. Add the bot first, then approve.`);
      const data = await threadsData.get(threadID).catch(() => null) || {};
      await threadsData.set(threadID, { ...data, threadID, threadName: info.threadName || data.threadName || "Unnamed", participantIDs: info.participantIDs || data.participantIDs || [], isApproved: true, approvedAt: Date.now() });
      try { await api.sendMessage(`✅ Approved! Bot will now stay in this group. Type ${prefix}help to see commands.`, threadID); } catch (e) { console.error("[APPROVEGC] notify", e.message); }
      return message.reply(`✅ Approved ${threadID} (${info.threadName || "Unnamed"})\nBot will now stay in that group.`);
    } catch (e) {
      console.error("[APPROVEGC]", e);
      return message.reply("❌ Failed: " + e.message);
    }
  }
};
