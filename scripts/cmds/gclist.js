module.exports = {
  config: {
    name: "gclist",
    version: "1.2",
    author: "FENG",
    countDown: 5,
    role: 2,
    description: "List all groups bot is in",
    category: "admin",
    guide: "{pn} | {pn} <page> | {pn} <search> | {pn} approved | {pn} unapproved"
  },
  onStart: async function ({ message, args, api, threadsData }) {
    try {
      const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
      const raw = String(args[0] || "").trim().toLowerCase();
      let page = 1;
      let filter = "";
      if (raw) {
        if (/^\d+$/.test(raw)) page = parseInt(raw, 10);
        else filter = raw;
      }
      let groups = [];
      let allData = {};
      try {
        if (typeof threadsData.getAll === "function") {
          const all = await threadsData.getAll();
          allData = Array.isArray(all) ? Object.fromEntries(all.map(d => [String(d.threadID || d.id), d])) : (all || {});
        }
      } catch {}
      if (Object.keys(allData).length) {
        groups = Object.entries(allData).map(([threadID, d]) => ({
          threadID,
          name: d.threadName || d.name || "Unnamed",
          participantIDs: d.participantIDs || [],
          isApproved: !!d.isApproved,
          isBanned: !!d.isBanned
        }));
      } else {
        let timestamp = null;
        for (let iter = 0; iter < 20; iter++) {
          const batch = await api.getThreadList(100, timestamp, ["INBOX"]).catch(() => []);
          if (!batch.length) break;
          for (const t of batch) if (t.isGroup) groups.push(t);
          if (batch.length < 100) break;
          timestamp = batch[batch.length - 1]?.timestamp;
          if (!timestamp) break;
        }
        const datas = await Promise.all(groups.map(g => threadsData.get(g.threadID).catch(() => ({}))));
        groups = groups.map((g, i) => ({ ...g, isApproved: !!datas[i]?.isApproved, isBanned: !!datas[i]?.isBanned }));
      }
      if (filter === "approved") groups = groups.filter(g => g.isApproved && !g.isBanned);
      else if (filter === "unapproved") groups = groups.filter(g => !g.isApproved);
      else if (filter === "banned") groups = groups.filter(g => g.isBanned);
      else if (filter) groups = groups.filter(g => String(g.name || "").toLowerCase().includes(filter) || String(g.threadID).includes(filter));
      groups.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      if (!groups.length) return message.reply(filter ? `❌ No groups match "${filter}"` : "❌ Bot is in no groups");
      const perPage = 10;
      const totalPages = Math.ceil(groups.length / perPage);
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      const start = (page - 1) * perPage;
      const slice = groups.slice(start, start + perPage);
      let msg = `📋 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗦𝗧 (${groups.length} total) - Page ${page}/${totalPages}${filter ? ` - Filter: ${filter}` : ""}\n\n`;
      for (let i = 0; i < slice.length; i++) {
        const g = slice[i];
        const status = g.isBanned ? "🚫" : g.isApproved ? "✅" : "❌";
        const members = g.participantIDs?.length ?? "?";
        msg += `${start + i + 1}. ${status} ${g.name || "Unnamed"}\n`;
        msg += ` ID: ${g.threadID}\n`;
        msg += ` Members: ${members}\n`;
        if (g.unreadCount) msg += ` Unread: ${g.unreadCount}\n`;
        msg += `\n`;
      }
      msg += `Use ${prefix}gclist <page> for more\n`;
      msg += `To approve: ${prefix}approveGC <ID>\n`;
      msg += `To leave: ${prefix}leaveGC <ID>`;
      return message.reply(msg);
    } catch (e) {
      console.error("[GCLIST]", e);
      return message.reply("❌ Failed: " + e.message);
    }
  }
};
