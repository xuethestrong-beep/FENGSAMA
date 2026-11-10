const fs = require("fs-extra");
module.exports = {
  config: {
    name: "bank",
    version: "2.3 NO LIMIT",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Bank system",
    category: "economy",
    guide: "{pn} | {pn} deposit <amount> | {pn} withdraw <amount> | {pn} balance"
  },
  onStart: async function ({ message, args, event, usersData, api }) {
    const userID = event.senderID;
    const userData = await usersData.get(userID);
    const money = userData.money || 0;
    const bankData = userData.bank || 0;

    const command = args[0]?.toLowerCase();

    if (!command || command === "balance" || command === "bal") {
      return message.reply(
        `🏦 𝗕𝗔𝗡𝗞\n`+
        `👤 User: ${userData.name || userID}\n`+
        `💵 Wallet: $${money.toLocaleString()}\n`+
        `🏦 Bank: $${bankData.toLocaleString()}\n`+
        `💰 Total: $${(money + bankData).toLocaleString()}`
      );
    }

    if (command === "deposit" || command === "dep") {
      let amount = args[1]?.toLowerCase();
      if (amount === "all") amount = money;
      else amount = parseInt(amount);
      
      if (isNaN(amount) || amount <= 0) return message.reply("❌ Enter valid amount. Ex: bank deposit 1000");
      if (amount > money) return message.reply(`❌ You don't have $${amount.toLocaleString()} in wallet. Wallet: $${money.toLocaleString()}`);
      
      await usersData.set(userID, { money: money - amount, bank: bankData + amount });
      return message.reply(`✅ Deposited $${amount.toLocaleString()} to bank.\n🏦 Bank: $${(bankData + amount).toLocaleString()}`);
    }

    if (command === "withdraw" || command === "wd" || command === "with") {
      let amount = args[1]?.toLowerCase();
      if (amount === "all") amount = bankData;
      else amount = parseInt(amount);

      if (isNaN(amount) || amount <= 0) return message.reply("❌ Enter valid amount. Ex: bank withdraw 1000");
      if (amount > bankData) return message.reply(`❌ You don't have $${amount.toLocaleString()} in bank. Bank: $${bankData.toLocaleString()}`);
      
      await usersData.set(userID, { money: money + amount, bank: bankData - amount });
      return message.reply(`✅ Withdrew $${amount.toLocaleString()} from bank.\n💵 Wallet: $${(money + amount).toLocaleString()}`);
    }

    return message.reply("🏦 Guide: bank | bank deposit <amount/all> | bank withdraw <amount/all>");
  }
};
