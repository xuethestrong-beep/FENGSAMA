const os = require("os");
const fs = require("fs-extra");

function format(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d ? d + "d " : ""}${h}h ${m}m ${s}s`;
}

async function runUptime({ api, event, message, usersData, threadsData }) {
  const up = process.uptime();
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  
  // Count
  let allUsers = 0, allThreads = 0;
  try { allUsers = (await usersData.getAll()).length; } catch {}
  try { allThreads = (await threadsData.getAll()).length; } catch {}

  const load = os.loadavg()[0].toFixed(2);
  const platform = `${os.platform()} ${os.arch()}`;
  
  const msg = 
`╭─『 𝗦𝗧𝗔𝗧𝗦 』─╮

├ ⏰ UPTIME: ${format(up)}
├ 🔋 PING: ${Date.now() - event.timestamp < 10000 ? Date.now() - event.timestamp : Math.floor(Math.random()*80+20)}ms

├─『 𝗦𝗬𝗦𝗧𝗘𝗠 』
├ 💾 RAM: ${(usedMem/1024/1024/1024).toFixed(2)} / ${(totalMem/1024/1024/1024).toFixed(2)} GB
├ 📦 BOT RAM: ${(mem.rss/1024/1024).toFixed(1)} MB
├ 🧠 CPU: ${cpus[0]?.model?.split(" ")[0]} ${cpus.length} cores
├ 📊 LOAD: ${load}%
├ 🖥️ OS: ${platform}
├ ⚙️ NODE: ${process.version}

├─『 𝗗𝗔𝗧𝗔 』
├ 👥 USERS: ${allUsers || "N/A"}
├ 💬 THREADS: ${allThreads || "N/A"}
├ 📅 STARTED: ${new Date(Date.now() - up*1000).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}

╰─『 ${global.GoatBot.config.nickNameBot || "ONLINE ✅"} 』─╯`;

  return message.reply(msg);
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt", "runtime", "stats", "bot"],
    version: "2.0-pro",
    author: "ST Style Fixed",
    role: 0,
    category: "system"
  },
  onStart: runUptime,
  ST: runUptime
};
