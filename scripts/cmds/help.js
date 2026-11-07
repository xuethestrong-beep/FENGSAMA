module.exports = {
  name: "help",
  async execute({ api, event, cmds }) {
    let msg = "🔥 FENG COMMANDS 🔥\n\n";
    for (const [name, cmd] of cmds) msg += `!${name} - ${cmd.description || ""}\n`;
    api.sendMessage(msg, event.threadID);
  }
  }
