module.exports = {
  config: {
    name: "shell",
    aliases: ["sh", "exec", "cmd"],
    version: "1.0",
    author: "FengSama",
    role: 2, // 2 = OWNER ONLY, safe!
    countDown: 2,
    category: "owner"
  },
  onStart: async function ({ api, event, args, message }) {
    const { exec } = require("child_process");
    const cmd = args.join(" ").trim();
    if (!cmd) return message.reply("💻 Usage: !shell ls\n!shell pwd\n!shell pm2 list");

    // Block dangerous commands
    const blocked = ["rm -rf /", "mkfs", ":(){:|:&};:", "shutdown", "reboot", "passwd"];
    if (blocked.some(b => cmd.includes(b))) return message.reply("❌ Blocked dangerous command");

    exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
      let out = (stdout || stderr || err?.message || "No output").toString();
      if (out.length > 4000) out = out.slice(0, 4000) + "\n...truncated";
      message.reply(`📟 $ ${cmd}\n\n${out}`);
    });
  }
};
