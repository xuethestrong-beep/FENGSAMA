module.exports = {
  config: { name: "bank", version: "2.0", role: 0, category: "economy", guide: "{pn} deposit <amount> | withdraw <amount> | all | interest | balance" },
  onStart: async function ({ args, message, usersData, event }) {
    const { bankData } = global.db;
    const action = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    const uid = event.senderID;
    const wallet = await usersData.get(uid,"money")||0;
    let bankInfo = await bankData.get(uid) || { bankBalance: 0, lastInterest: 0 };
    let bankBal = bankInfo.bankBalance||0;
    const f = (n) => `$${n.toLocaleString()}`;
    const now = Date.now();
    const lastInterest = bankInfo.lastInterest||0;
    const canClaim = now-lastInterest>=86400000;
    let interest = canClaim && bankBal>0 ? Math.floor(bankBal*0.05) : 0;

    if (!action || action==="balance" || action==="bal"){
      let txt=`🏦 BANK\n──────────────\n💰 Bank: ${f(bankBal)}\n💵 Wallet: ${f(wallet)}\n💎 Total: ${f(bankBal+wallet)}`;
      txt+= interest>0?`\n\n✨ Interest ready: ${f(interest)} (5%)\nType: bank interest`:`\n\n⏳ Next interest: ${Math.floor((86400000-(now-lastInterest))/3600000)}h`;
      return message.reply(txt);
    }
    if (action==="interest"){
      if (!canClaim) return message.reply(`⏳ Interest already claimed`);
      if (bankBal<=0) return message.reply("❌ No money in bank");
      await bankData.set(uid, { bankBalance: bankBal+interest, lastInterest: now });
      return message.reply(`✨ +${f(interest)} (5%)\n🏦 New bank: ${f(bankBal+interest)}`);
    }
    if (action==="deposit" || action==="dep" || action==="all"){
      let dep = action==="all"?wallet:amount;
      if (!dep||dep<=0) return message.reply("❌ Enter amount");
      if (wallet<dep) return message.reply(`❌ Wallet only ${f(wallet)}`);
      await usersData.set(uid,{money:wallet-dep});
      await bankData.set(uid,{bankBalance:bankBal+dep,lastInterest:bankInfo.lastInterest||0});
      return message.reply(`✅ Deposited ${f(dep)}\n🏦 Bank: ${f(bankBal+dep)}`);
    }
    if (action==="withdraw" || action==="with"){
      if (!amount||amount<=0) return message.reply("❌ Enter amount");
      if (bankBal<amount) return message.reply(`❌ Bank only ${f(bankBal)}`);
      await usersData.set(uid,{money:wallet+amount});
      await bankData.set(uid,{bankBalance:bankBal-amount,lastInterest:bankInfo.lastInterest||0});
      return message.reply(`✅ Withdrew ${f(amount)}\n💵 Wallet: ${f(wallet+amount)}`);
    }
  }
};
