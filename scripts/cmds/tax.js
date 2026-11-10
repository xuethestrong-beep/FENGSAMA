module.exports = {
  config: {
    name: "tax",
    aliases: ["taxinfo"],
    version: "2.1",
    author: "FENG",
    countDown: 10,
    role: 0,
    description: "Shows your marginal tax bracket and estimated midnight tax (wallet first, then bank)",
    category: "economy",
    guide: "{pn}"
  },

  // Marginal tax - only the portion ABOVE each threshold is taxed, no cliff penalty
  // 0 - 100k: 0% | 100k - 500k: 2% | 500k - 1M: 5% | 1M+: 8%
  calcTax: function (total) {
    let tax = 0;
    if (total > 1000000) tax += (total - 1000000) * 0.08;
    if (total > 500000) tax += (Math.min(total, 1000000) - 500000) * 0.05;
    if (total > 100000) tax += (Math.min(total, 500000) - 100000) * 0.02;
    return Math.floor(tax);
  },

  // Call this from your midnight cron (Asia/Manila) - deducts wallet first, then bank
  collectTax: async function (uid, usersData, bankData) {
    const userData = await usersData.get(uid) || {};
    const wallet = Math.max(0, Number(userData.money) || 0);
    const bank = Math.max(0, Number((await bankData.get(uid))?.bankBalance) || 0);
    const total = wallet + bank;
    const tax = this.calcTax(total);
    if (tax <= 0) return { tax: 0, total };

    const fromWallet = Math.min(tax, wallet);
    const fromBank = tax - fromWallet;

    await usersData.set(uid, {
      money: wallet - fromWallet,
      data: userData.data || {}
    });
    if (fromBank > 0) {
      await bankData.set(uid, { bankBalance: bank - fromBank });
    }
    return { tax, total, fromWallet, fromBank };
  },

  onStart: async function ({ message, usersData, event }) {
    try {
      const uid = event.senderID;
      const { bankData } = global.db;

      const userData = await usersData.get(uid) || {};
      const w = Math.max(0, Number(userData.money) || 0);
      const b = Math.max(0, Number((await bankData.get(uid))?.bankBalance) || 0);
      const total = w + b;
      const tax = this.calcTax(total);

      let bracket = "0% ✅";
      if (total >= 1000000) bracket = "8% 💀 (marginal)";
      else if (total >= 500000) bracket = "5% ⚠️ (marginal)";
      else if (total >= 100000) bracket = "2% (marginal)";

      return message.reply(
        `💳 TAX INFO\n──────────────\n` +
        `Total: $${total.toLocaleString()}\n` +
        `Bracket: ${bracket}\n` +
        `Est. midnight tax: $${tax.toLocaleString()}\n\n` +
        `💵 Wallet: $${w.toLocaleString()}\n` +
        `🏦 Bank: $${b.toLocaleString()}\n\n` +
        (tax > 0
          ? `⚠️ Deducted at 12:00 AM Manila - wallet first, then bank.`
          : `✅ No tax - under $100,000`)
      );
    } catch (e) {
      console.error("[TAX] Error:", e.message);
      return message.reply("❌ Failed to load tax info. Try again.");
    }
  }
};
