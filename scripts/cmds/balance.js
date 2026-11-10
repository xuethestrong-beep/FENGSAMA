module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "3.1",
    author: "FENG",
    countDown: 2,
    role: 0,
    description: "Check wallet, bank and total balance",
    category: "economy",
    guide: "{pn} - check your balance\n{pn} @user - check someone else"
  },

  onStart: async function ({ message, usersData, event }) {
    try {
      const { bankData } = global.db;
      const f = (n) => `$${Number(n || 0).toLocaleString()}`;

      const getUser = async (uid, mentionName) => {
        const userData = await usersData.get(uid) || {};
        const w = Math.max(0, Number(userData.money) || 0);
        let b = 0;
        try {
          b = Math.max(0, Number((await bankData.get(uid))?.bankBalance) || 0);
        } catch {}
        const total = w + b;

        let taxLabel = "";
        let taxNote = "✅ No tax";
        if (total >= 1000000) {
          taxLabel = " 💀 8%";
          taxNote = "⚠️ Rich tax bracket: 8%";
        } else if (total >= 500000) {
          taxLabel = " ⚠️ 5%";
          taxNote = "⚠️ Rich tax bracket: 5%";
        } else if (total >= 100000) {
          taxLabel = " 2%";
          taxNote = "⚠️ Rich tax bracket: 2%";
        }

        if (mentionName) {
          const cleanName = String(mentionName).replace(/^@/, "");
          return `👤 ${cleanName}${taxLabel}\n💰 ${f(total)} total\n↳ 💵 ${f(w)} • 🏦 ${f(b)}`;
        }
        return `💳 balance${taxLabel}\n──────────────\n💰 ${f(total)} total\n\n💵 wallet ${f(w)}\n🏦 bank ${f(b)}\n\n${taxNote}`;
      };

      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);

      if (mentionIDs.length > 0) {
        let msg = "";
        for (const uid of mentionIDs) {
          msg += await getUser(uid, mentions[uid]) + "\n\n";
        }
        return message.reply(msg.trim());
      }

      return message.reply(await getUser(event.senderID, null));
    } catch (err) {
      console.error("[BALANCE] Error:", err.message);
      return message.reply("❌ Failed to get balance. Try again.");
    }
  }
};
