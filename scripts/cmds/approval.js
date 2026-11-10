module.exports = {
  config: {
    name: "approval",
    version: "1.2",
    author: "FENG",
    role: 1,
    countDown: 3,
    category: "box",
    guide: "{pn} on/off/list | {pn} approve <id|number> | {pn} deny <id|number>"
  },
  onStart: async function ({ message, event, args, threadsData, api }) {
    try {
      const prefix = global.GoatBot?.config?.prefix || global.config?.prefix || "!";
      const tid = event.threadID;
      const data = await threadsData.get(tid).catch(() => null) || {};
      data.settings = data.settings || {};
      const clean = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").slice(0, 50);
      const save = async () => { await threadsData.set(tid, data); };
      const t = String(args[0] || "").toLowerCase();
      if (t === "list") {
        const p = Array.isArray(data.pending) ? data.pending : [];
        if (!p.length) return message.reply("No pending members.");
        let page = 1;
        if (args[1] && /^\d+$/.test(args[1])) page = parseInt(args[1], 10);
        const perPage = 10;
        const totalPages = Math.ceil(p.length / perPage);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        const slice = p.slice((page - 1) * perPage, page * perPage);
        let msg = `📋 Pending (${p.length}) - Page ${page}/${totalPages}\nApproval: ${data.settings.approval ? "ON ✅" : "OFF ❌"}\n\n`;
        slice.forEach((x, i) => { msg += `${(page - 1) * perPage + i + 1}. ${clean(x.name)} (${x.id})\n`; });
        msg += `\n${prefix}approval approve <id|number> to approve\n${prefix}approval deny <id|number> to reject`;
        return message.reply(msg);
      }
      if (t === "approve" || t === "deny" || t === "reject") {
        const target = String(args[1] || "").trim();
        if (!target) return message.reply(`Usage: ${prefix}approval ${t} <id|number>\nSee: ${prefix}approval list`);
        const p = Array.isArray(data.pending) ? data.pending : [];
        if (!p.length) return message.reply("No pending members.");
        let idx = -1;
        if (/^\d+$/.test(target) && Number(target) <= p.length && Number(target) >= 1 && String(p[Number(target) - 1]?.id) !== target) {
          idx = Number(target) - 1;
        } else {
          idx = p.findIndex(x => String(x.id) === target);
          if (idx === -1 && /^\d+$/.test(target)) idx = Number(target) - 1;
        }
        if (idx < 0 || idx >= p.length) return message.reply(`❌ Not in pending: ${clean(target)}`);
        const [removed] = p.splice(idx, 1);
        data.pending = p;
        if (t === "approve") {
          data.approvedMembers = Array.isArray(data.approvedMembers) ? data.approvedMembers : [];
          if (!data.approvedMembers.some(x => String(x.id) === String(removed.id))) data.approvedMembers.push({ id: String(removed.id), name: clean(removed.name), approvedAt: Date.now() });
          await save();
          return message.reply(`✅ Approved ${clean(removed.name)} (${removed.id})\nThey were kicked on join - re-add them to let them in.`);
        }
        await save();
        return message.reply(`❌ Denied ${clean(removed.name)} (${removed.id}). They stay out.`);
      }
      if (t === "on" || t === "off") {
        data.settings.approval = t === "on";
        await save();
        return message.reply(t === "on" ? "✅ Approval ON - new members will be kicked and added to pending." : "❌ Approval OFF - new members can join freely.");
      }
      return message.reply(`Approval: ${data.settings.approval ? "ON ✅" : "OFF ❌"}\n${prefix}approval on/off/list\n${prefix}approval approve <id|number>\n${prefix}approval deny <id|number>`);
    } catch (e) {
      console.error("[APPROVAL]", e);
      return message.reply("❌ Failed: " + e.message);
    }
  },
  onEvent: async function ({ event, api, threadsData }) {
    try {
      if (event.logMessageType !== "log:subscribe") return;
      const added = event.logMessageData?.addedParticipants || [];
      if (!added.length) return;
      const botID = api.getCurrentUserID();
      const tid = event.threadID;
      const data = await threadsData.get(tid).catch(() => null) || {};
      if (!data.settings?.approval) return;
      for (const p of added) {
        const uid = String(p.userFbId);
        if (uid === String(botID)) continue;
        if (data.approvedMembers?.some(x => String(x.id) === uid)) continue;
        const name = String(p.fullName || p.firstName || "Unknown").replace(/[\r\n]+/g, " ").slice(0, 50);
        data.pending = Array.isArray(data.pending) ? data.pending : [];
        if (!data.pending.some(x => String(x.id) === uid)) data.pending.push({ id: uid, name, addedAt: Date.now() });
        await threadsData.set(tid, data).catch(() => {});
        try { await api.sendMessage(`⏳ Approval is ON. ${name} needs admin approval.\n${global.GoatBot?.config?.prefix || "!"}approval list to review.`, tid); } catch {}
        await api.removeUserFromGroup(uid, tid).catch(() => {});
      }
    } catch (e) {
      console.error("[APPROVAL-EVENT]", e.message);
    }
  }
};
