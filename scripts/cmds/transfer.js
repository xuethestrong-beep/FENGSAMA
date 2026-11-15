module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "send", "give"],
    version: "1.3",
    author: "FENG (fixed)",
    countDown: 3,
    role: 0,
    description: "Send money to another user (5% fee)",
    category: "economy",
    guide: {
      en: "{pn} @user <amount|all>\nReply + {pn} <amount>\n{pn} @user 100"
    }
  },

  onStart: async function ({ args, message, event, usersData }) {
    try {
      // FIXED: Get targetID from mention OR reply
      let targetID = null;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      }

      if (!targetID) return message.reply("👤 Usage:\ntransfer @user 100\nReply to someone + transfer 100\ntransfer @user all");

      if (targetID === event.senderID) return message.reply("❌ Can't transfer to yourself");

      const amountRaw = args.find(a => {
        const v = String(a).toLowerCase();
        return v === "all" || /^\d[\d,]*$/.test(v);
      });

      if (!amountRaw) return message.reply("❌ Enter amount\nEx: transfer @user 100 or reply + transfer 100");

      const sender = (await usersData.get(event.senderID)) || {};
      const target = (await usersData.get(targetID)) || {};

      const senderBal = Math.max(0, Number(sender.money) || 0);
      const targetBal = Math.max(0, Number(target.money) || 0);

      let amount = 0;
      if (amountRaw.toLowerCase() === "all") amount = senderBal;
      else amount = Number(amountRaw.replace(/[,]/g, ""));

      if (!Number.isInteger(amount) || amount <= 0) return message.reply("❌ Enter valid amount");
      if (amount < 10) return message.reply("❌ Min $10");
      if (senderBal < amount) return message.reply(`❌ You only have $${senderBal.toLocaleString()}`);

      const fee = Math.floor(amount * 0.05);
      const receive = amount - fee;

      await usersData.set(event.senderID, { money: senderBal - amount });
      await usersData.set(targetID, { money: targetBal + receive });

      const name = await usersData.getName(targetID).catch(() => "User");

      return message.reply(
        `💸 Transfer Success\n──────────────\n` +
        `👤 To: ${name}\n` +
        `💵 Sent: $${amount.toLocaleString()}\n` +
        (fee > 0 ? `💸 Fee (5%): $${fee.toLocaleString()}\n📥 They got: $${receive.toLocaleString()}\n` : ``) +
        `💰 Your bal: $${(senderBal - amount).toLocaleString()}`
      );

    } catch (e) {
      console.error("[TRANSFER] Error:", e);
      return message.reply("❌ Transfer failed.");
    }
  }
};
