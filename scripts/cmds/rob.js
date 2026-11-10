module.exports = {
  config: {
    name: "rob",
    version: "1.1",
    author: "FENG",
    countDown: 600,
    role: 0,
    description: "Rob a user - 45% success, steal 10-30% (max $50k)",
    category: "economy",
    guide: "{pn} @user"
  },

  onStart: async function ({ message, event, usersData }) {
    try {
      const targetID = event.mentions && Object.keys(event.mentions)[0];
      if (!targetID) return message.reply("👤 Usage: rob @user to steal");
      if (targetID === event.senderID) return message.reply("❌ Can't rob yourself");

      const robber = await usersData.get(event.senderID) || {};
      const victim = await usersData.get(targetID) || {};
      const robberMoney = Math.max(0, Number(robber.money) || 0);
      const victimBal = Math.max(0, Number(victim.money) || 0);

      if (victimBal < 1000) return message.reply("❌ Victim too poor (<$1000)");

      // Victim protection: can't be robbed again within 30 min
      const lastRobbed = Number(victim.data?.lastRobbed) || 0;
      const VICTIM_COOLDOWN = 30 * 60 * 1000;
      if (Date.now() - lastRobbed < VICTIM_COOLDOWN) {
        const leftMin = Math.ceil((VICTIM_COOLDOWN - (Date.now() - lastRobbed)) / 60000);
        return message.reply(`🛡️ ${await usersData.getName(targetID).catch(() => "User")} was recently robbed. Try again in ${leftMin}m.`);
      }

      // Shield blocks rob, consumes shield, preserves victim money + data
      const victimInv = [...(victim.data?.inventory || [])];
      if (victimInv.includes("shield")) {
        victimInv.splice(victimInv.indexOf("shield"), 1);
        await usersData.set(targetID, {
          money: victimBal,
          data: { ...(victim.data || {}), inventory: victimInv, lastRobbed: Date.now() }
        });
        return message.reply(`🛡️ ${await usersData.getName(targetID).catch(() => "User")} blocked your rob with shield!`);
      }

      const success = Math.random() < 0.45;

      if (!success) {
        const fine = Math.min(500, robberMoney);
        await usersData.set(event.senderID, {
          money: robberMoney - fine,
          data: robber.data || {}
        });
        // Mark victim as recently targeted even on fail, so they can't be spammed
        await usersData.set(targetID, {
          money: victimBal,
          data: { ...(victim.data || {}), lastRobbed: Date.now() }
        });
        return message.reply(`🚨 Rob failed! Lost $${fine.toLocaleString()}`);
      }

      const stolenRaw = Math.floor(victimBal * (0.1 + Math.random() * 0.2));
      const stolen = Math.min(stolenRaw, 50000); // cap so rich players can't be drained in 1 rob

      await usersData.set(targetID, {
        money: victimBal - stolen,
        data: { ...(victim.data || {}), lastRobbed: Date.now() }
      });
      await usersData.set(event.senderID, {
        money: robberMoney + stolen,
        data: robber.data || {}
      });

      return message.reply(`💰 Rob success! Stole $${stolen.toLocaleString()} from ${await usersData.getName(targetID).catch(() => "User")}`);
    } catch (e) {
      console.error("[ROB] Error:", e.message);
      return message.reply("❌ Rob failed. Try again.");
    }
  }
};
