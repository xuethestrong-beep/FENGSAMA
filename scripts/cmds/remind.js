module.exports = {
  config: {
    name: "remind",
    aliases: ["remindme", "reminder"],
    version: "1.0",
    author: "FengSama",
    role: 0,
    countDown: 5,
    category: "utility"
  },
  onStart: async function ({ api, event, args, message }) {
    const timeStr = args[0];
    const task = args.slice(1).join(" ").trim();
    
    if (!timeStr || !task) {
      return message.reply("⏰ Usage: !remind 10m drink water\n!remind 1h check bot\n!remind 30s hello\n\nUnits: s,m,h");
    }

    let ms = 0;
    const num = parseInt(timeStr);
    if (timeStr.endsWith("s")) ms = num * 1000;
    else if (timeStr.endsWith("m")) ms = num * 60 * 1000;
    else if (timeStr.endsWith("h")) ms = num * 60 * 60 * 1000;
    else return message.reply("❌ Use s,m,h. Ex: 10m, 1h, 30s");

    if (ms < 5000) return message.reply("❌ Min 5 seconds");
    if (ms > 24*60*60*1000) return message.reply("❌ Max 24 hours");

    message.reply(`✅ OK! I'll remind you in ${timeStr}:\n"${task}"`);

    setTimeout(() => {
      api.sendMessage(`⏰ REMINDER @${event.senderID}\n\n📝 ${task}\n⏱️ Set ${timeStr} ago`, event.threadID, null, event.messageID);
    }, ms);
  }
};
