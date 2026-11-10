module.exports = {
  config: {
    name: "lottery",
    version: "1.1",
    author: "FENG",
    countDown: 60,
    role: 0,
    description: "Buy a lottery ticket for $2,000 - 1% jackpot chance",
    category: "economy",
    guide: "{pn}"
  },

  onStart: async function ({ message, usersData, event }) {
    try {
      const uid = event.senderID;
      const userData = await usersData.get(uid) || {};
      const bal = Math.max(0, Number(userData.money) || 0);
      const cost = 2000;

      if (bal < cost) return message.reply(`❌ Lottery costs $${cost.toLocaleString()}, you have $${bal.toLocaleString()}`);

      const r = Math.random();
      let reward = 0;
      let msg = `🎟️ LOTTERY — $${cost.toLocaleString()}\n──────────────\n`;

      // EV: 1%*50k + 9%*5k + 20%*2.5k = $1,450 on $2,000 cost = 72.5% RTP
      if (r < 0.01) {
        reward = 50000;
        msg += `🎉 JACKPOT!!!\n💰 Won $${reward.toLocaleString()}!!!`;
      } else if (r < 0.1) {
        reward = 5000;
        msg += `✨ Big win!\n💰 Won $${reward.toLocaleString()}`;
      } else if (r < 0.3) {
        reward = 2500;
        msg += `😊 Small win\n💰 Won $${reward.toLocaleString()}`;
      } else {
        msg += `💨 You lost...\n❌ Lost $${cost.toLocaleString()}`;
      }

      const newBal = bal - cost + reward;

      await usersData.set(uid, {
        money: newBal,
        data: userData.data || {}
      });

      return message.reply(msg + `\n💵 Balance: $${newBal.toLocaleString()}`);
    } catch (e) {
      console.error("[LOTTERY] Error:", e.message);
      return message.reply("❌ Lottery failed. Try again.");
    }
  }
};
