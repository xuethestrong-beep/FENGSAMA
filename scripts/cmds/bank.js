module.exports = {
  config: {
    name: "bank",
    aliases: ["banking"],
    version: "2.4",
    author: "FENG (fixed)",
    countDown: 3,
    role: 0,
    description: "Bank system - deposit, withdraw, check",
    category: "economy",
    guide: {
      en: "{pn} - check balance\n{pn} deposit <amount/all>\n{pn} withdraw <amount/all>"
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const { bankData } = global.db;
      const userID = event.senderID;
      
      const userData = (await usersData.get(userID)) || {};
      const wallet = Math.max(0, Number(userData.money) || 0);
      
      let bankBalance = 0;
      try {
        bankBalance = Math.max(0, Number((await bankData.get(userID))?.bankBalance) || 0);
      } catch {}

      const command = args[0]?.toLowerCase();

      // Show balance
      if (!command || command === "balance" || command === "bal" || command === "check") {
        const total = wallet + bankBalance;
        return message.reply(
          `🏦 BANK\n` +
          `──────────────\n` +
          `💵 Wallet: $${wallet.toLocaleString()}\n` +
          `🏦 Bank: $${bankBalance.toLocaleString()}\n` +
          `💰 Total: $${total.toLocaleString()}`
        );
      }

      // Deposit
      if (command === "deposit" || command === "dep") {
        let amount = args[1]?.toLowerCase();
        if (!amount) return message.reply("❌ Usage: bank deposit 1000 or bank deposit all");
        
        if (amount === "all") amount = wallet;
        else amount = parseInt(amount);

        if (isNaN(amount) || amount <= 0) return message.reply("❌ Enter valid amount. Ex: bank deposit 1000");
        if (amount > wallet) return message.reply(`❌ Not enough wallet. You have $${wallet.toLocaleString()}`);

        await usersData.set(userID, { money: wallet - amount });
        await bankData.set(userID, { bankBalance: bankBalance + amount });

        return message.reply(`✅ Deposited $${amount.toLocaleString()} to bank.\n🏦 New bank: $${(bankBalance + amount).toLocaleString()}`);
      }

      // Withdraw
      if (command === "withdraw" || command === "wd" || command === "with") {
        let amount = args[1]?.toLowerCase();
        if (!amount) return message.reply("❌ Usage: bank withdraw 1000 or bank withdraw all");
        
        if (amount === "all") amount = bankBalance;
        else amount = parseInt(amount);

        if (isNaN(amount) || amount <= 0) return message.reply("❌ Enter valid amount. Ex: bank withdraw 1000");
        if (amount > bankBalance) return message.reply(`❌ Not enough bank. Bank: $${bankBalance.toLocaleString()}`);

        await usersData.set(userID, { money: wallet + amount });
        await bankData.set(userID, { bankBalance: bankBalance - amount });

        return message.reply(`✅ Withdrew $${amount.toLocaleString()} from bank.\n💵 New wallet: $${(wallet + amount).toLocaleString()}`);
      }

      return message.reply("🏦 Guide:\nbank\nbank deposit <amount/all>\nbank withdraw <amount/all>");

    } catch (e) {
      console.error(e);
      return message.reply("❌ Bank error. Try again.");
    }
  }
};
