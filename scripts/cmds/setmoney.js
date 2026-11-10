module.exports = {
 config: {
  name: "setmoney",
  aliases: ["setbal", "editmoney"],
  version: "2.0 ADMIN ONLY",
  author: "FENG",
  countDown: 3,
  role: 2, // 2 = adminBot only
  description: "Admin only - set money",
  category: "economy",
  guide: "{pn} 1000000\nReply + {pn} 5000\n{pn} @user 5000"
 },
 onStart: async function ({ message, event, args, usersData, api }) {
  const senderID = event.senderID;
  let targetID = senderID;
  let amountText = args[0];

  // Reply to someone
  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
    amountText = args[0];
  }
  // Mention
  else if (event.mentions && Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
    amountText = args[args.length - 1];
  }

  const amount = parseInt(amountText?.replace(/,/g, ""));
  if (isNaN(amount)) {
    return message.reply(
      "💰 ADMIN SETMONEY:\n\n" +
      "!setmoney 1000000 → set your money\n" +
      "Reply + !setmoney 5000 → set that person's money\n" +
      "!setmoney @user 5000 → set mentioned user"
    );
  }

  if (amount < 0) return message.reply("❌ No negative");
  if (amount > 1000000000000) return message.reply("❌ Max 1T");

  try {
    await usersData.set(targetID, { money: amount });
    let name = targetID;
    try {
      const info = await api.getUserInfo(targetID);
      name = info[targetID].name;
    } catch {}

    return message.reply(`✅ ADMIN: Set ${name}'s money to $${amount.toLocaleString()}`);
  } catch (e) {
    return message.reply("❌ Error: " + e.message);
  }
 }
};
