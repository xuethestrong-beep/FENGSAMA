module.exports = {
  config: {
    name: "addmoney",
    aliases: ["addbal", "givemoney"],
    version: "1.4",
    author: "FENG",
    countDown: 3,
    role: 2,
    description: "Add money to user (admin only)",
    category: "economy",
    guide: "{pn} @mention amount\n{pn} 10000\n{pn} @user 50000"
  },

  onStart: async function ({ message, event, args, usersData }) {
    try {
      let targetID = null;

      // 1. Mention (anywhere in args)
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // 2. Reply
      else if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      }
      // 3. Self
      else {
        targetID = event.senderID;
      }

      // Find first numeric arg, ignore mention strings like "@user"
      const numArg = args.find(a => {
        const clean = String(a).replace(/[@,]/g, "");
        return clean !== "" && !isNaN(clean);
      });
      const amount = numArg ? Number(String(numArg).replace(/[@,]/g, "")) : NaN;

      if (!Number.isInteger(amount) || amount <= 0) {
        return message.reply("❌ Usage: addmoney @user 10000\nOr reply: addmoney 50000");
      }

      const userData = await usersData.get(targetID) || {};
      const oldMoney = Math.max(0, Number(userData.money) || 0);
      const newMoney = oldMoney + amount;

      await usersData.set(targetID, {
        money: newMoney,
        data: userData.data || {}
      });

      const name = await usersData.getName(targetID).catch(() => "User");
      console.log(`[ADDMONEY] Admin ${event.senderID} gave $${amount} to ${targetID} (${name}) | ${oldMoney} -> ${newMoney}`);

      return message.reply(
        `✅ Added $${amount.toLocaleString()} to ${name}\n` +
        `💰 Old: $${oldMoney.toLocaleString()}\n` +
        `💰 New: $${newMoney.toLocaleString()}`
      );
    } catch (e) {
      console.error("[ADDMONEY] Error:", e.message);
      return message.reply("❌ Error: " + e.message);
    }
  }
};
