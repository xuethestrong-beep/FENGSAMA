module.exports = {
 config: {
  name: "addmoney",
  aliases: ["addbal", "givemoney"],
  version: "1.0",
  author: "FENG",
  countDown: 5,
  role: 2, // 2 = only bot admin, use 1 for group admin, 0 for everyone
  description: "Add money to user",
  category: "economy",
  guide: "{pn} @mention amount\n{pn} 10000\n{pn} @user 50000"
 },
 onStart: async function ({ message, event, args, usersData, api }) {
  let targetID, amount;
  
  // Check if replying or mentioning
  if (event.mentions && Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
    amount = parseInt(args[args.length - 1]);
  } else if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
    amount = parseInt(args[0]);
  } else {
    targetID = event.senderID;
    amount = parseInt(args[0]);
  }

  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Usage: !addmoney @user 10000\nOr reply to user: !addmoney 50000");
  }

  try {
    const userData = await usersData.get(targetID);
    const oldMoney = userData.money || 0;
    const newMoney = oldMoney + amount;
    
    await usersData.set(targetID, { money: newMoney });
    
    const info = await api.getUserInfo(targetID);
    const name = info[targetID].name;

    return message.reply(`✅ Added $${amount.toLocaleString()} to ${name}\n💰 Old: $${oldMoney.toLocaleString()}\n💰 New: $${newMoney.toLocaleString()}\n\nNow test with !bal`);

  } catch (e) {
    console.log(e);
    return message.reply("❌ Error: " + e.message);
  }
 }
};
