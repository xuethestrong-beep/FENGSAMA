const { findUid } = global.utils;

module.exports = {
  config: {
    name: "add",
    version: "2.1",
    author: "NIGG - Fixed",
    countDown: 5,
    role: 1,
    description: "Add user to group (GC Admin & Bot Admin only)",
    category: "box chat",
    guide: "{pn} [uid | fb link]"
  },
  langs: {
    en: {
      noPerm: "❌ Only GC Admin and Bot Admin can use this!",
      alreadyInGroup: "Already in group",
      successAdd: "✅ Added %1 members",
      failedAdd: "❌ Failed %1 members",
      approve: "⏳ %1 in approval list",
      cannotGetUid: "Cannot get UID",
      cannotAddUser: "Cannot add - FB blocked or user blocks adds"
    }
  },
  onStart: async function ({ message, api, event, args, threadsData, getLang }) {
    const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const isGCAdmin = adminIDs.includes(event.senderID);
    const botAdmins = global.GoatBot?.config?.adminBot || global.config?.adminBot || [];
    const isBotAdmin = botAdmins.includes(event.senderID) || botAdmins.includes(event.senderID.toString());
    
    if (!isGCAdmin && !isBotAdmin) return message.reply(getLang("noPerm"));

    const botID = api.getCurrentUserID();
    let added = 0, waiting = 0, failed = [];

    if (!args[0]) return message.reply("Usage: !add <uid or fb link>");

    for (const item of args) {
      let uid = item;
      if (isNaN(item)) {
        try { uid = await findUid(item); } 
        catch { failed.push(item); continue; }
      }
      if (members.some(m => m.userID == uid && m.inGroup)) {
        failed.push(`${item} (already in group)`);
        continue;
      }
      try {
        await api.addUserToGroup(uid, event.threadID);
        if (approvalMode && !adminIDs.includes(botID)) waiting++; else added++;
      } catch { failed.push(item); }
    }

    let msg = "";
    if (added) msg += `✅ Added ${added}\n`;
    if (waiting) msg += `⏳ ${waiting} waiting approval\n`;
    if (failed.length) msg += `❌ Failed: ${failed.join(", ")}`;
    return message.reply(msg || "Done");
  }
};
