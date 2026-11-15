module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money"],
    version: "3.2",
    author: "FENG (fixed)",
    countDown: 2,
    role: 0,
    description: "Check wallet, bank and total balance",
    category: "economy",
    guide: {
      en: "{pn} - check your balance\n{pn} @user - check someone else's balance"
    }
  },

  onStart: async function ({ message, usersData, event }) {
    try {
      const { bankData } = global.db;
      const format = (n) => `$${Number(n || 0).toLocaleString()}`;

      const getUser = async (uid, mentionName) => {
        const userData = (await usersData.get(uid)) || {};
        const wallet = Math.max(0, Number(userData.money) || 0);
        
        let bank = 0;
        try {
          const bankInfo = await bankData.get(uid);
          bank = Math.max(0, Number(bankInfo?.bankBalance) || 0);
        } catch {}

        const total = wallet + bank;

        let taxLabel = "";
        let taxNote = "✅ No tax - keep grinding!";

        if (total >= 1000000) {
          taxLabel = " 💀 8% Tax";
          taxNote = "⚠️ Rich tax: 8% on next income";
        } else if (total >= 500000) {
          taxLabel = " ⚠️ 5% Tax";
          taxNote = "⚠️ Rich tax: 5% on next income";
        } else if (total >= 100000) {
          taxLabel = " 2% Tax";
          taxNote = "⚠️ Tax bracket: 2%";
        }

        if (mentionName) {
          const cleanName = String(mentionName).replace(/^@/, "");
          return `👤 ${cleanName}${taxLabel}\n💰 ${format(total)} total\n↳ 💵 ${format(wallet)} wallet • 🏦 ${format(bank)} bank`;
        }

        return (
          `💳 Your Balance${taxLabel}\n` +
          `──────────────\n` +
          `💰 ${format(total)} total\n\n` +
          `💵 Wallet: ${format(wallet)}\n` +
          `🏦 Bank: ${format(bank)}\n\n` +
          `${taxNote}`
        );
      };

      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);

      if (mentionIDs.length > 0) {
        let msg = "";
        for (const uid of mentionIDs) {
          msg += (await getUser(uid, mentions[uid])) + "\n\n";
        }
        return message.reply(msg.trim());
      }

      return message.reply(await getUser(event.senderID, null));

    } catch (err) {
      console.error("[BALANCE] Error:", err);
      return message.reply("❌ Failed to get balance. Try again.");
    }
  }
};
