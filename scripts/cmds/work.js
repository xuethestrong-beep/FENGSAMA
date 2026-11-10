const jobs = [
  { name: "Developer 💻", key: "developer", min: 400, max: 1200 },
  { name: "Designer 🎨", key: "designer", min: 300, max: 900 },
  { name: "Chef 🍳", key: "chef", min: 250, max: 800 },
  { name: "Driver 🚕", key: "driver", min: 200, max: 700 },
  { name: "Streamer 📺", key: "streamer", min: 500, max: 1500 },
  { name: "Barista ☕", key: "barista", min: 150, max: 600 },
];

module.exports = {
  config: {
    name: "work",
    version: "2.1",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Work a job to earn money",
    category: "economy",
    guide: "{pn}\n{pn} developer\n{pn} streamer"
  },

  onStart: async function ({ usersData, event, message, args }) {
    try {
      const uid = event.senderID;
      const data = await usersData.get(uid) || {};
      const money = Math.max(0, Number(data.money) || 0);
      const last = Number(data.data?.lastWork) || 0;
      const cooldown = 5 * 60 * 1000;

      if (Date.now() - last < cooldown) {
        const left = cooldown - (Date.now() - last);
        const sec = Math.floor(left / 1000);
        const percent = Math.floor(((cooldown - left) / cooldown) * 10);
        const bar = "█".repeat(percent) + "░".repeat(10 - percent);
        return message.reply(`⏳ Resting...\n[${bar}] ${percent * 10}%\n↳ ${Math.floor(sec / 60)}m ${sec % 60}s left`);
      }

      // Optional job pick: work streamer, else random
      let job = null;
      const pick = (args[0] || "").toLowerCase();
      if (pick) {
        job = jobs.find(j => j.key === pick || j.name.toLowerCase().includes(pick));
        if (!job) {
          return message.reply(`❌ Unknown job. Available:\n${jobs.map(j => `• ${j.name}`).join("\n")}`);
        }
      } else {
        job = jobs[Math.floor(Math.random() * jobs.length)];
      }

      const earn = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
      const newMoney = money + earn;

      await usersData.set(uid, {
        money: newMoney,
        data: { ...(data.data || {}), lastWork: Date.now() }
      });

      return message.reply(
        `💼 WORK\n──────────────\nJob: ${job.name}\n💰 Earned: $${earn.toLocaleString()}\n💵 Balance: $${newMoney.toLocaleString()}`
      );
    } catch (e) {
      console.error(" Error:", e.message);
      return message.reply("❌ Work failed. Try again.");
    }
  }
};
