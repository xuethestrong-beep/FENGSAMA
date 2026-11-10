const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    version: "1.7",
    author: "NIGG - Fixed",
    countDown: 3,
    role: 2, // only BOT ADMIN can use this
    description: "Add/remove bot admin",
    category: "box chat",
    guide: "{pn} add @tag | {pn} remove @tag | {pn} list"
  },
  langs: {
    en: {
      added: "✅ Added %1 bot admin(s):\n%2",
      alreadyAdmin: "⚠️ %1 already admin:\n%2",
      missingIdAdd: "⚠️ Tag or reply to add admin",
      removed: "✅ Removed %1 admin(s):\n%2",
      notAdmin: "⚠️ %1 not admin:\n%2",
      missingIdRemove: "⚠️ Tag or reply to remove admin",
      listAdmin: "👑 Bot Admins:\n%1"
    }
  },
  onStart: async function ({ message, args, usersData, event, getLang }) {
    const type = args[0]?.toLowerCase();
    
    const getUids = () => {
      if (Object.keys(event.mentions).length > 0) return Object.keys(event.mentions);
      if (event.messageReply) return [event.messageReply.senderID];
      return args.slice(1).filter(a => !isNaN(a));
    };

    switch (type) {
      case "add":
      case "-a": {
        const uids = getUids();
        if (!uids.length) return message.reply(getLang("missingIdAdd"));
        
        const toAdd = uids.filter(uid => !config.adminBot.includes(uid));
        const already = uids.filter(uid => config.adminBot.includes(uid));
        
        config.adminBot.push(...toAdd);
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        
        const names = await Promise.all(uids.map(async uid => {
          const name = await usersData.getName(uid).catch(() => uid);
          return `• ${name} (${uid})`;
        }));
        
        let msg = "";
        if (toAdd.length) msg += getLang("added", toAdd.length, names.slice(0, toAdd.length).join("\n")) + "\n";
        if (already.length) msg += getLang("alreadyAdmin", already.length, already.map(id => `• ${id}`).join("\n"));
        return message.reply(msg);
      }
      case "remove":
      case "-r": {
        const uids = getUids();
        if (!uids.length) return message.reply(getLang("missingIdRemove"));
        
        const toRemove = uids.filter(uid => config.adminBot.includes(uid));
        const notAdmin = uids.filter(uid => !config.adminBot.includes(uid));
        
        for (const uid of toRemove) {
          config.adminBot.splice(config.adminBot.indexOf(uid), 1);
        }
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        
        const names = await Promise.all(toRemove.map(async uid => {
          const name = await usersData.getName(uid).catch(() => uid);
          return `• ${name} (${uid})`;
        }));
        
        let msg = "";
        if (toRemove.length) msg += getLang("removed", toRemove.length, names.join("\n")) + "\n";
        if (notAdmin.length) msg += getLang("notAdmin", notAdmin.length, notAdmin.map(id => `• ${id}`).join("\n"));
        return message.reply(msg);
      }
      case "list":
      case "-l": {
        const names = await Promise.all(config.adminBot.map(async uid => {
          const name = await usersData.getName(uid).catch(() => uid);
          return `• ${name} (${uid})`;
        }));
        return message.reply(getLang("listAdmin", names.join("\n") || "No admins"));
      }
      default:
        return message.reply("Use: admin add @tag | admin remove @tag | admin list");
    }
  }
};
