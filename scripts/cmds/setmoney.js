module.exports = {
  config: {
    name: "setmoney",
    aliases: ["setbal", "editmoney"],
    version: "2.2",
    author: "FENG",
    countDown: 3,
    role: 2,
    description: "Admin only - set money",
    category: "economy",
    guide: "{pn} 1000000\nReply + {pn} 5000\n{pn} @user 5000"
  },

  onStart: async function ({ message, event, args, usersData }) {
    try {
      let targetID = null;
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else {
        targetID = event.senderID;
      }

      const numArg = args.find(a => {
        const clean = String(a).replace(/[@,]/g, "");
        return clean !== "" && !isNaN(clean);
      });

      if (!numArg) {
        return message.reply(
          "💰 ADMIN SETMONEY:\n\n" +
          "setmoney 1000000 → set your money\n" +
          "Reply + setmoney 5000 → set that person's money\n" +
          "setmoney @user 5000 → set mentioned user"
        );
      }

      const amount = Number(String(numArg).replace(/[@,]/g, ""));

      if (!Number.isInteger(amount)) {
        return message.reply("❌ Must be a whole number, no decimals.");
      }
      if (amount < 0) return message.reply("❌ No negative");
      if (amount > Number.MAX_SAFE_INTEGER) {
        return message.reply("❌ Too large - exceeds JS safe number limit.");
      }

      const userData = await usersData.get(targetID) || {};
      const oldMoney = Math.max(0, Number(userData.money) || 0);

      await usersData.set(targetID, { money: amount, data: userData.data || {} });

      const name = await usersData.getName(targetID).catch(() => "User");
      console.log(`[SETMONEY] Admin ${event.senderID} set ${targetID} (${name}) ${oldMoney} -> ${amount}`);

      return message.reply(
        `✅ ADMIN: Set ${name}'s money\n` +
        `💰 Old: $${oldMoney.toLocaleString()}\n` +
        `💰 New: $${amount.toLocaleString()}`
      );
    } catch (e) {
      console.error("[SETMONEY] Error:", e.message);
      return message.reply("❌ Error: " + e.message);
    }
  }
};
