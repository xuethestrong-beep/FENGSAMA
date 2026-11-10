module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "send", "give"],
    version: "1.1",
    author: "FENG",
    countDown: 3,
    role: 0,
    description: "Send money to another user (5% fee)",
    category: "economy",
    guide: "{pn} @user <amount|all>\n{pn} @user 100"
  },

  onStart: async function ({ args, message, event, usersData }) {
    try {
      const targetID = event.mentions && Object.keys(event.mentions)[0];
      if (!targetID) return message.reply("👤 Usage: transfer @user <amount|all>");
      if (targetID === event.senderID) return message.reply("❌ Can't transfer to yourself");

      // Find amount arg by value, not position - works for "transfer @user 100" and "transfer 100 @user"
      const amountRaw = args.find(a => {
        const v = a.toLowerCase();
        return v === "all" || /^\d[\d,]*$/.test(v);
      });
      if (!amountRaw) return message.reply("❌ Enter valid amount\nUsage: transfer @user <amount|all>");

      const sender = await usersData.get(event.senderID) || {};
      const target = await usersData.get(targetID) || {};
      const senderBal = Math.max(0, Number(sender.money) || 0);
      const targetBal = Math.max(0, Number(target.money) || 0);

      const MIN = 10;
      let amount = 0;
      if (amountRaw.toLowerCase() === "all") amount = senderBal;
      else amount = Number(amountRaw.replace(/[,]/g, ""));

      if (!Number.isInteger(amount) || amount <= 0) return message.reply("❌ Enter valid amount");
      if (amount < MIN) return message.reply(`❌ Min transfer is $${MIN}`);
      if (senderBal < amount) return message.reply(`❌ You only have $${senderBal.toLocaleString()}`);

      const fee = Math.floor(amount * 0.05); // 5% fee stops alt farming
      const receive = amount - fee;

      await usersData.set(event.senderID, {
        money: senderBal - amount,
        data: sender.data || {}
      });
      await usersData.set(targetID, {
        money: targetBal + receive,
        data: target.data || {}
      });

      const name = await usersData.getName(targetID).catch(() => "User");
      return message.reply(
        `💸 Sent $${amount.toLocaleString()} to ${name}\n` +
        (fee > 0 ? `💰 Fee (5%): $${fee.toLocaleString()}\n📥 They received: $${receive.toLocaleString()}\n` : ``) +
        `Your new balance: $${(senderBal - amount).toLocaleString()}`
      );
    } catch (e) {
      console.error("[TRANSFER] Error:", e.message);
      return message.reply("❌ Transfer failed. Try again.");
    }
  }
};
