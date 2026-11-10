module.exports = {
  config: {
    name: "game",
    aliases: ["gamble"],
    version: "1.1",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Gamble with coinflip or dice",
    category: "game",
    guide: "{pn} coinflip <h/t> <bet|all>\n{pn} dice <1-6> <bet|all>"
  },

  onStart: async function ({ args, usersData, event, message }) {
    try {
      const type = (args[0] || "").toLowerCase();
      const choice = (args[1] || "").toLowerCase();
      const betRaw = (args[2] || "").toLowerCase();

      const HELP = "🎮 Usage:\ngame coinflip <h/t> <bet|all>\ngame dice <1-6> <bet|all>";

      if (!type || !choice || !betRaw) return message.reply(HELP);

      const uid = event.senderID;
      const userData = await usersData.get(uid) || {};
      const bal = Math.max(0, Number(userData.money) || 0);

      const MIN_BET = 10;
      const MAX_BET = 100000;

      let bet = 0;
      if (betRaw === "all") bet = bal;
      else bet = Number(betRaw.replace(/[,]/g, ""));

      if (!Number.isInteger(bet) || bet <= 0) return message.reply(HELP + `\nMin: $${MIN_BET} | Max: $${MAX_BET.toLocaleString()}`);
      if (bet < MIN_BET) return message.reply(`❌ Min bet is $${MIN_BET}`);
      if (bet > MAX_BET) return message.reply(`❌ Max bet is $${MAX_BET.toLocaleString()}`);
      if (bal < bet) return message.reply(`❌ Balance $${bal.toLocaleString()}`);

      // --- COINFLIP ---
      if (type === "coinflip" || type === "cf") {
        let pick = null;
        if (["h", "heads", "head"].includes(choice)) pick = "h";
        else if (["t", "tails", "tail"].includes(choice)) pick = "t";
        else return message.reply("❌ Coinflip choice must be h/heads or t/tails");

        const res = Math.random() < 0.5 ? "h" : "t";
        const win = pick === res;
        // 0.9x profit = 10% house edge, stops martingale
        const profit = win ? Math.floor(bet * 0.9) : -bet;
        const newBal = bal + profit;

        await usersData.set(uid, { money: newBal, data: userData.data || {} });

        return message.reply(
          `🪙 ${res === "h" ? "Heads" : "Tails"}\n` +
          (win ? `✅ Won $${profit.toLocaleString()}` : `❌ Lost $${bet.toLocaleString()}`) +
          `\n💰 $${newBal.toLocaleString()}`
        );
      }

      // --- DICE ---
      if (type === "dice") {
        const guess = Number(choice);
        if (!Number.isInteger(guess) || guess < 1 || guess > 6) {
          return message.reply("❌ Dice guess must be 1-6");
        }

        const dice = Math.floor(Math.random() * 6) + 1;
        const win = guess === dice;
        const profit = win ? bet * 4 : -bet;
        const newBal = bal + profit;

        await usersData.set(uid, { money: newBal, data: userData.data || {} });

        return message.reply(
          `🎲 Rolled: ${dice}\n` +
          (win ? `✅ Won $${profit.toLocaleString()}` : `❌ Lost $${bet.toLocaleString()}`) +
          `\n💰 $${newBal.toLocaleString()}`
        );
      }

      return message.reply(HELP);
    } catch (e) {
      console.error("[GAME] Error:", e.message);
      return message.reply("❌ Game failed. Try again.");
    }
  }
};
