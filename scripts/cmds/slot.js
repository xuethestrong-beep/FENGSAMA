module.exports = {
  config: {
    name: "slots",
    aliases: ["slot"],
    version: "1.1",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Play slots - match 3 to win big",
    category: "game",
    guide: "{pn} <bet|all>\n{pn} 100\n{pn} all"
  },

  onStart: async function ({ args, usersData, event, message }) {
    try {
      const uid = event.senderID;
      const MIN_BET = 10;
      const MAX_BET = 100000;

      const userData = await usersData.get(uid) || {};
      const bal = Math.max(0, Number(userData.money) || 0);

      let bet = 0;
      const raw = (args[0] || "").toLowerCase();
      if (raw === "all") bet = bal;
      else bet = Number(raw.replace(/[,]/g, ""));

      if (!Number.isInteger(bet) || bet <= 0) {
        return message.reply("🎰 Usage: slots <bet|all>\nMin: $10 | Max: $100,000");
      }
      if (bet < MIN_BET) return message.reply(`❌ Min bet is $${MIN_BET.toLocaleString()}`);
      if (bet > MAX_BET) return message.reply(`❌ Max bet is $${MAX_BET.toLocaleString()}`);
      if (bal < bet) return message.reply(`❌ You have only $${bal.toLocaleString()}`);

      const emojis = ["🍒", "🍋", "🍊", "🍉", "⭐", "🔔", "💎"];
      const r = () => emojis[Math.floor(Math.random() * emojis.length)];
      const s1 = r(), s2 = r(), s3 = r();

      let win = 0;
      let label = "";
      if (s1 === s2 && s2 === s3) {
        if (s1 === "💎") {
          win = bet * 10;
          label = "💎 JACKPOT! 💎";
        } else {
          win = bet * 7;
          label = "🎉 TRIPLE!";
        }
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        win = Math.floor(bet * 2);
        label = "✨ Pair!";
      }

      const newBal = bal - bet + win;

      await usersData.set(uid, {
        money: newBal,
        data: userData.data || {}
      });

      return message.reply(
        `🎰 SLOTS\n──────────────\n[ ${s1} | ${s2} | ${s3} ]\n` +
        (label ? `\n${label}\n` : `\n`) +
        (win > 0
          ? `✅ Won $${win.toLocaleString()}`
          : `❌ Lost $${bet.toLocaleString()}`) +
        `\n💰 $${newBal.toLocaleString()}`
      );
    } catch (e) {
      console.error("[SLOTS] Error:", e.message);
      return message.reply("❌ Slots failed. Try again.");
    }
  }
};
