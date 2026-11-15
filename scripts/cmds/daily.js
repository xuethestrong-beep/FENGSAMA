module.exports = {
  config: {
    name: "daily",
    aliases: ["claim", "rewards"],
    version: "2.1",
    author: "FENG (fixed)",
    countDown: 3,
    role: 0,
    description: "Claim your daily reward with streak bonus",
    category: "economy",
    guide: {
      en: "{pn} - claim daily reward"
    }
  },

  onStart: async function ({ usersData, event, message }) {
    const uid = event.senderID;
    const now = Date.now();
    const ONE_DAY = 86400000; // 24 hours

    try {
      const fullData = (await usersData.get(uid)) || {};
      const userData = fullData.data || {};
      const money = Math.max(0, Number(fullData.money) || 0);

      const lastDaily = Number(userData.lastDaily) || 0;
      const lastStreak = Number(userData.dailyStreak) || 0;

      // Check cooldown
      if (now - lastDaily < ONE_DAY) {
        const left = ONE_DAY - (now - lastDaily);
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        const s = Math.floor((left % 60000) / 1000);
        return message.reply(
          `⏰ Already Claimed Today!\n` +
          `──────────────\n` +
          `⏳ Reset in: ${h}h ${m}m ${s}s\n` +
          `🔥 Current Streak: ${lastStreak} days\n` +
          `💡 Come back tomorrow!`
        );
      }

      // Streak logic
      let streak = 1;
      if (lastDaily && now - lastDaily < ONE_DAY * 2) {
        streak = lastStreak + 1;
      }
      if (streak > 30) streak = 30; // cap at 30

      const base = 1500 + Math.floor(Math.random() * 1500); // 1500-3000
      const streakBonus = Math.min(streak * 100, 1500);
      const weeklyBonus = streak % 7 === 0 ? 2000 : 0;
      const reward = base + streakBonus + weeklyBonus;

      const newMoney = money + reward;

      await usersData.set(uid, {
        money: newMoney,
        data: {
          ...userData,
          lastDaily: now,
          dailyStreak: streak
        }
      });

      let msg =
        `💰 DAILY CLAIMED!\n` +
        `──────────────\n` +
        `🎁 Base: $${base.toLocaleString()}\n`;

      if (streakBonus > 0) msg += `🔥 Streak x${streak}: +$${streakBonus.toLocaleString()}\n`;
      if (weeklyBonus > 0) msg += `🎉 7-Day Bonus: +$${weeklyBonus.toLocaleString()}\n`;

      msg +=
        `──────────────\n` +
        `✅ Total: +$${reward.toLocaleString()}\n` +
        `💵 Balance: $${newMoney.toLocaleString()}\n` +
        `📅 Streak: ${streak} day${streak > 1 ? "s" : ""}`;

      if (streak === 7 || streak === 14 || streak === 21 || streak === 30) {
        msg += `\n🏆 Milestone reached!`;
      }

      return message.reply(msg);

    } catch (err) {
      console.error("[DAILY] Error:", err);
      return message.reply("❌ Failed to claim daily. Try again later.");
    }
  }
};
