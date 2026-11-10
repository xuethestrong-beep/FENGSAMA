module.exports = {
  config: {
    name: "bank",
    aliases: ["banking"],
    version: "2.1",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Deposit, withdraw and claim bank interest",
    category: "economy",
    guide: "{pn} - balance\n{pn} deposit <amount|all>\n{pn} withdraw <amount|all>\n{pn} all - deposit all\n{pn} interest - claim 5% daily interest"
  },

  onStart: async function ({ args, message, usersData, event }) {
    try {
      const { bankData } = global.db;
      const uid = event.senderID;
      const now = Date.now();
      const ONE_DAY = 86400000;
      const f = (n) => `$${Number(n || 0).toLocaleString()}`;

      const action = (args[0] || "balance").toLowerCase();
      const rawAmount = (args[1] || "").toLowerCase();

      const userData = await usersData.get(uid) || {};
      const wallet = Math.max(0, Number(userData.money) || 0);

      let bankInfo = await bankData.get(uid);
      if (!bankInfo) {
        bankInfo = { bankBalance: 0, lastInterest: 0 };
      }
      let bankBal = Math.max(0, Number(bankInfo.bankBalance) || 0);
      let lastInterest = Number(bankInfo.lastInterest) || 0;

      // First time: no interest yet, start timer on first deposit
      const hasHistory = lastInterest > 0;
      const canClaim = hasHistory && now - lastInterest >= ONE_DAY;
      const interest = canClaim && bankBal > 0 ? Math.floor(bankBal * 0.05) : 0;

      const saveWallet = async (newWallet) => {
        await usersData.set(uid, { money: newWallet, data: userData.data || {} });
      };
      const saveBank = async (newBank, newLastInterest) => {
        await bankData.set(uid, { bankBalance: newBank, lastInterest: newLastInterest });
      };

      if (action === "balance" || action === "bal") {
        let txt = `🏦 BANK\n──────────────\n💰 Bank: ${f(bankBal)}\n💵 Wallet: ${f(wallet)}\n💎 Total: ${f(bankBal + wallet)}`;
        if (interest > 0) {
          txt += `\n\n✨ Interest ready: ${f(interest)} (5%)\nType: bank interest`;
        } else if (!hasHistory) {
          txt += `\n\n⏳ Interest starts after your first deposit`;
        } else {
          const left = ONE_DAY - (now - lastInterest);
          txt += `\n\n⏳ Next interest: ${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m`;
        }
        return message.reply(txt);
      }

      if (action === "interest") {
        if (!hasHistory) return message.reply("❌ Deposit first to start earning interest.");
        if (!canClaim) {
          const left = ONE_DAY - (now - lastInterest);
          return message.reply(`⏳ Interest already claimed\nNext: ${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m left`);
        }
        if (bankBal <= 0) return message.reply("❌ No money in bank");
        const newBank = bankBal + interest;
        await saveBank(newBank, now);
        return message.reply(`✨ +${f(interest)} (5%)\n🏦 New bank: ${f(newBank)}`);
      }

      if (action === "deposit" || action === "dep" || action === "all") {
        let dep = 0;
        if (action === "all" || rawAmount === "all") dep = wallet;
        else dep = parseInt(rawAmount, 10);

        if (!dep || isNaN(dep) || dep <= 0) return message.reply("❌ Enter amount: bank deposit <amount|all>");
        if (wallet < dep) return message.reply(`❌ Wallet only ${f(wallet)}`);

        const newBank = bankBal + dep;
        const newLast = hasHistory ? lastInterest : now;
        await saveWallet(wallet - dep);
        await saveBank(newBank, newLast);
        return message.reply(`✅ Deposited ${f(dep)}\n🏦 Bank: ${f(newBank)}\n💵 Wallet: ${f(wallet - dep)}`);
      }

      if (action === "withdraw" || action === "with") {
        let amt = 0;
        if (rawAmount === "all") amt = bankBal;
        else amt = parseInt(rawAmount, 10);

        if (!amt || isNaN(amt) || amt <= 0) return message.reply("❌ Enter amount: bank withdraw <amount|all>");
        if (bankBal < amt) return message.reply(`❌ Bank only ${f(bankBal)}`);

        await saveWallet(wallet + amt);
        await saveBank(bankBal - amt, lastInterest);
        return message.reply(`✅ Withdrew ${f(amt)}\n💵 Wallet: ${f(wallet + amt)}\n🏦 Bank: ${f(bankBal - amt)}`);
      }

      return message.reply(`🏦 BANK HELP\n──────────────\nbank - balance\nbank deposit <amount|all>\nbank withdraw <amount|all>\nbank all - deposit all wallet\nbank interest - claim 5%`);
    } catch (err) {
      console.error(" Error:", err.message);
      return message.reply("❌ Bank failed. Try again.");
    }
  }
};
