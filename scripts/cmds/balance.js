module.exports = {
  config: { name: "balance", aliases: ["bal"], version: "3.0", role: 0, category: "economy" },
  onStart: async function ({ message, usersData, event }) {
    const { bankData } = global.db;
    const f = (n) => `$${Number(n||0).toLocaleString()}`;
    const getUser = async (uid, mentionName) => {
      const w = await usersData.get(uid,"money")||0;
      const b = (await bankData.get(uid))?.bankBalance||0;
      const total = w+b;
      let tax = total>=1000000?" 💀 8%":total>=500000?" ⚠️ 5%":total>=100000?" 2%":"";
      if (mentionName) return `👤 ${mentionName}${tax}\n💰 ${f(total)} total\n↳ 💵 ${f(w)} • 🏦 ${f(b)}`;
      return `💳 balance${tax}\n──────────────\n💰 ${f(total)} total\n\n💵 wallet  ${f(w)}\n🏦 bank    ${f(b)}\n\n${total>=100000?"⚠️ Rich tax active":"✅ No tax"}`;
    };
    if (Object.keys(event.mentions).length>0){
      let msg=""; for(const uid of Object.keys(event.mentions)){ msg+=await getUser(uid,event.mentions[uid].replace("@",""))+"\n\n"; }
      return message.reply(msg.trim());
    }
    return message.reply(await getUser(event.senderID,null));
  }
};
