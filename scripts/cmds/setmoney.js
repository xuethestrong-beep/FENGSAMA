module.exports = {
 config: {
  name: "setmoney",
  aliases: ["setbal", "editmoney"],
  version: "1.1",
  author: "FENG",
  countDown: 3,
  role: 0,
  description: "Edit money - reply supported",
  category: "economy",
  guide: "{pn} 1000000\nReply to user + {pn} 5000"
 },
 onStart: async function ({ message, event, args, usersData, api }) {
  const senderID = event.senderID;
  let targetID = senderID;
  let amountText = args[0];

  // 1. If replying to someone
  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
    amountText = args[0];
  }
  // 2. If mentioning someone
  else if (event.mentions && Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
    amountText = args[args.length - 1];
  }

  const amount = parseInt(amountText?.replace(/,/g, ""));

  if (isNaN(amount)) {
    return message.reply(
      "💰 SET MONEY GUIDE:\n\n" +
      "!setmoney 1000000 → set YOUR money\n" +
      "Reply to someone + !setmoney 5000 → set THEIR money\n" +
      "!setmoney @user 5000 → set mentioned user\n\n" +
      "Examples:\n" +
      "• !setmoney 0\n" +
      "• Reply + !setmoney 100000"
    );
  }

  // Permission: if editing others, only admin can (change to allow all if you want)
  if (targetID !== senderID) {
    // Remove this check if you want ANYONE can edit others by reply
    // const isAdmin = global.GoatBot?.config?.adminBot?.includes(senderID);
    // if (!isAdmin) return message.reply("❌ You can only edit your own money. Don't reply to others.");
  }

  if (amount < 0) return message.reply("❌ No negative");
  if (amount > 1000000000) return message.reply("❌ Max 1B");

  try {
    await usersData.set(targetID, { money: amount });
    const info = await api.getUserInfo(targetID);
    const name = info[targetID].name;

    if (targetID === senderID) {
      return message.reply(`✅ Your money set to $${amount.toLocaleString()}\nDo !bal`);
    } else {
      return message.reply(`✅ Set ${name}'s money to $${amount.toLocaleString()}\nID: ${targetID}`);
    }
  } catch (e) {
    return message.reply("❌ Error: " + e.message);
  }
 }
};
