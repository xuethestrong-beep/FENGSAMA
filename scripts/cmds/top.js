module.exports = {
  config: {
    name: "top",
    aliases: ["leaderboard", "lb"],
    version: "1.1",
    author: "FENG",
    countDown: 10,
    role: 0,
    description: "Top 15 richest users (wallet + bank)",
    category: "economy",
    guide: "{pn}"
  },

  onStart: async function ({ message, event, usersData }) {
    try {
      const all = await usersData.getAll();
      const { bankData } = global.db;

      // Parallel bank fetch instead of sequential N+1 loop
      const entries = await Promise.all(all.map(async (u) => {
        let bank = 0;
        try {
          bank = (await bankData.get(u.userID))?.bankBalance || 0;
        } catch { bank = 0; }
        const wallet = Math.max(0, Number(u.money) || 0);
        return { id: u.userID, total: wallet + Number(bank || 0) };
      }));

      const lb = entries
        .filter(e => e.total > 0)
        .sort((a, b) => b.total - a.total);

      if (lb.length === 0) return message.reply("🏆 No one has money yet. Type work to start!");

      const top15 = lb.slice(0, 15);
      const medals = ["🥇", "🥈", "🥉"];

      let msg = `🏆 TOP 15 RICHEST\n──────────────\n`;
      for (let i = 0; i < top15.length; i++) {
        const name = await usersData.getName(top15[i].id).catch(() => "Unknown User");
        const rank = medals[i] || `${i + 1}.`;
        msg += `${rank} ${name} — $${top15[i].total.toLocaleString()}\n`;
      }

      // Self rank, even if not in top 15
      const myIndex = lb.findIndex(e => e.id === event.senderID);
      if (myIndex !== -1) {
        const myTotal = lb[myIndex].total;
        msg += `──────────────\n📍 Your rank: #${myIndex + 1} — $${myTotal.toLocaleString()}`;
      } else {
        msg += `──────────────\n📍 Your rank: Unranked — $0`;
      }

      return message.reply(msg);
    } catch (e) {
      console.error("[TOP] Error:", e.message);
      return message.reply("❌ Failed to load leaderboard. Try again.");
    }
  }
};
