module.exports = {
  config: {
    name: "tax",
    version: "1.6",
    author: "FENG",
    countDown: 5,
    role: 0,
    description: "Check tax fee",
    category: "economy",
    guide: "{pn} <amount>"
  },
  onStart: async function ({ message, args }) {
    let amount = args[0];
    if (!amount) return message.reply("💸 Usage: !tax <amount>\nEx: !tax 10000\nShows 10% tax fee");
    
    amount = parseInt(amount.toString().replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) return message.reply("❌ Invalid amount");

    const taxRate = 0.10; // 10%
    const tax = Math.floor(amount * taxRate);
    const afterTax = amount - tax;
    const receive = amount; // if you want to send amount, need to have amount + tax

    // Calculate if you want to SEND 10000, how much you need (including tax)
    const needToHave = Math.floor(amount / (1 - taxRate));
    const taxOnNeed = needToHave - amount;

    return message.reply(
      `💸 𝗧𝗔𝗫 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗢𝗥 (10%)\n\n`+
      `If you send: $${amount.toLocaleString()}\n`+
      `├ Tax (10%): $${tax.toLocaleString()}\n`+
      `└ Receiver gets: $${afterTax.toLocaleString()}\n\n`+
      `If you want receiver to get $${amount.toLocaleString()}:\n`+
      `├ You need: $${needToHave.toLocaleString()}\n`+
      `└ Tax: $${taxOnNeed.toLocaleString()}`
    );
  }
};
