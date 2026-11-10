module.exports = {
  config: { name: "daily", version: "1.0", role: 0, category: "economy" },
  onStart: async function ({ usersData, event, message }) {
    const uid=event.senderID; const data=await usersData.get(uid);
    const last=data.data?.lastDaily||0;
    if(Date.now()-last<86400000){
      const left=86400000-(Date.now()-last);
      return message.reply(`🌸 Already claimed\n⏳ ${Math.floor(left/3600000)}h ${Math.floor((left%3600000)/60000)}m left`);
    }
    const reward=1500+Math.floor(Math.random()*1500);
    await usersData.set(uid,{money:(data.money||0)+reward,data:{...data.data,lastDaily:Date.now()}});
    return message.reply(`💰 Daily\n──────────────\n+ $${reward.toLocaleString()}\n💵 New: $${((data.money||0)+reward).toLocaleString()}`);
  }
};
