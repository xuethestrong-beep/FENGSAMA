module.exports = {
  config: {
    name: "help",
    version: "2.6 FENG !",
    author: "FENG",
    countDown: 3,
    role: 0,
    shortDescription: "Help with ! prefix",
    longDescription: "Categorized help menu for ! prefix",
    category: "info",
    guide: "!help [category/command]"
  },

  onStart: async function ({ message, args, event }) {
    const prefix = "!"; // FORCE ! PREFIX
    const allCmds = [];
    const cmds = global.GoatBot.commands;
    
    for (const cmd of cmds.values()) {
      if (cmd.config?.name) allCmds.push(cmd.config);
    }

    const icons = {
      economy: "💰 ECONOMY",
      media: "🎬 MEDIA", 
      fun: "🎮 FUN",
      box: "📦 BOX",
      group: "👥 GROUP",
      events: "⚡ EVENTS",
      info: "ℹ️ INFO",
      owner: "👑 OWNER",
      utility: "🔧 UTILITY",
      game: "🎲 GAME",
      rank: "📊 RANK"
    };

    const categories = {};
    allCmds.forEach(c => {
      const cat = (c.category || "general").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c.name);
    });

    const input = (args[0] || "").toLowerCase();

    // Single command info
    if (input && cmds.has(input)) {
      const cfg = cmds.get(input).config;
      return message.reply(
        `╭─ ${cfg.name.toUpperCase()} ─╮\n` +
        `│ Name: ${prefix}${cfg.name}\n` +
        `│ Category: ${cfg.category}\n` +
        `│ Role: ${cfg.role}\n` +
        `│ Desc: ${cfg.description || cfg.shortDescription}\n` +
        `│ Guide: ${(cfg.guide || "").replaceAll("{pn}", prefix + cfg.name)}\n` +
        `╰──────────────╯`
      );
    }

    // Category view
    if (input && categories[input]) {
      const list = categories[input].sort().map(n => `│ ✦ ${prefix}${n}`).join("\n");
      return message.reply(
        `╭─ ${icons[input] || input.toUpperCase()} ─╮\n` +
        `${list}\n` +
        `╰──────────────╯\n\nTotal: ${categories[input].length} cmds\nUse ${prefix}help [cmd] for info`
      );
    }

    // Main menu
    let msg = `╭─ FENG BOT MENU ─╮\n`;
    msg += `│ Prefix: ${prefix}\n`;
    msg += `│ Commands: ${allCmds.length}\n`;
    msg += `╰──────────────╯\n\n`;

    for (const [cat, list] of Object.entries(categories).sort()) {
      const icon = icons[cat] || `📌 ${cat.toUpperCase()}`;
      msg += `╭─ ${icon} [${list.length}] ─╮\n`;
      const preview = list.sort().slice(0, 6).map(n => `${prefix}${n}`).join(", ");
      const more = list.length > 6 ? ` +${list.length - 6}` : "";
      msg += `│ ${preview}${more}\n`;
      msg += `╰──────────────╯\n`;
    }

    msg += `\n📌 USAGE:\n`;
    msg += `!help economy\n`;
    msg += `!help media\n`;
    msg += `!help fun\n`;
    msg += `!help box\n`;
    msg += `!help goodbye`;

    return message.reply(msg);
  }
};
