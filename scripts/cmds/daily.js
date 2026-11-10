module.exports = {
  config: {
    name: "daily",
    aliases: ["claim"],
    version: "2.0",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Claim your daily reward with streak bonus",
    category: "economy",
    guide: "{pn} - claim daily reward"
  },

  onStart: async function ({ usersData, event, message }) {
    const uid = event.senderID;
    const now = Date.now();
    const ONE_DAY = 86400000;

    try {
      const data = await usersData.get(uid) || {};
      const userData = data.data || {};
      const lastDaily = Number(userData.lastDaily) || 0;
      const lastStreak = Number(userData.dailyStreak) || 0;
      const money = Math.max(0, Number(data.money) || 0);

      if (now - lastDaily < ONE_DAY) {
        const left = ONE_DAY - (now - lastDaily);
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        return message.reply(`🌸 Already claimed\n⏳ ${h}h ${m}m left\n🔥 Streak: ${lastStreak} days`);
      }

      // Streak logic
      let streak = 1;
      if (lastDaily && now - lastDaily < ONE_DAY * 2) {
        streak = lastStreak + 1;
      }
      if (streak > 30) streak = 30;

      const base = 1500 + Math.floor(Math.random() * 1500);
      const streakBonus = Math.min(streak * 100, 1500);
      const weeklyBonus = streak % 7 === 0 ? 2000 : 0;
      const reward = base + streakBonus + weeklyBonus;
      const newMoney = money + reward;

      await usersData.set(uid, {
        money: newMoney,
        data: { ...userData, lastDaily: now, dailyStreak: streak }
      });

      let msg = `💰 Daily Claimed\n──────────────\n+ $${reward.toLocaleString()}`;
      if (streakBonus > 0) msg += `\n🔥 Streak x${streak}: +$${streakBonus.toLocaleString()}`;
      if (weeklyBonus > 0) msg += `\n🎁 7-Day Bonus: +$${weeklyBonus.toLocaleString()}`;
      msg += `\n💵 Balance: $${newMoney.toLocaleString()}\n📅 Streak: ${streak} day${streak > 1 ? "s" : ""}`;

      return message.reply(msg);

    } catch (err) {
      console.error("[DAILY] Error:", err.message);
      return message.reply("❌ Failed to claim daily. Try again.");
    }
  }
};
