module.exports = {
  config: {
    name: "top",
    aliases: ["leaderboard", "lb", "rich"],
    version: "1.2",
    author: "FENG (fixed)",
    countDown: 10,
    role: 0,
    description: "Top 15 richest users (wallet + bank)",
    category: "economy",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    try {
      const all = await usersData.getAll();
      const { bankData } = global.db;

      const entries = await Promise.all(all.map(async (u) => {
        let bank = 0;
        try {
          const b = await bankData.get(u.userID);
          bank = Number(b?.bankBalance) || 0;
        } catch { bank = 0; }
        const wallet = Math.max(0, Number(u.money) || 0);
        return { id: u.userID, wallet, bank, total: wallet + bank };
      }));

      const lb = entries
        .filter(e => e.total > 0)
        .sort((a, b) => b.total - a.total);

      if (lb.length === 0) return message.reply("🏆 No one has money yet. Type daily to start!");

      const top15 = lb.slice(0, 15);
      const medals = ["🥇", "🥈", "🥉"];
      let msg = `🏆 TOP 15 RICHEST\n──────────────\n`;

      for (let i = 0; i < top15.length; i++) {
        const name = await usersData.getName(top15[i].id).catch(() => `ID:${top15[i].id.slice(0,6)}`);
        const rank = medals[i] || `${i + 1}.`;
        msg += `${rank} ${name} — $${top15[i].total.toLocaleString()}\n`;
      }

      const myIndex = lb.findIndex(e => e.id === event.senderID);
      if (myIndex !== -1) {
        msg += `──────────────\n📍 You: #${myIndex + 1} — $${lb[myIndex].total.toLocaleString()} (W:$${lb[myIndex].wallet.toLocaleString()} B:$${lb[myIndex].bank.toLocaleString()})`;
      } else {
        msg += `──────────────\n📍 You: Unranked — $0`;
      }

      return message.reply(msg);

    } catch (e) {
      console.error("[TOP] Error:", e);
      return message.reply("❌ Failed to load leaderboard.");
    }
  }
};
