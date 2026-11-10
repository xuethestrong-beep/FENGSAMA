module.exports = {
  config: {
    name: "autoTax",
    version: "1.1",
    author: "FENG",
    description: "Collects marginal tax at 12:00 AM Manila, once per day",
    category: "events"
  },
  onStart: async function ({ usersData }) {
    const { bankData } = global.db;
    if (!bankData) return;
    const calcTax = (total) => {
      let tax = 0;
      if (total > 1000000) tax += (total - 1000000) * 0.08;
      if (total > 500000) tax += (Math.min(total, 1000000) - 500000) * 0.05;
      if (total > 100000) tax += (Math.min(total, 500000) - 100000) * 0.02;
      return Math.floor(tax);
    };
    const getManilaParts = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "numeric", minute: "numeric", hour12: false
      }).formatToParts(new Date());
      const get = (t) => parts.find(p => p.type === t)?.value;
      return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24, minute: Number(get("minute")) };
    };
    let lastTaxDate = null;
    let running = false;
    const runTax = async () => {
      if (running) return;
      const { date, hour, minute } = getManilaParts();
      if (hour !== 0 || minute > 5) return;
      if (lastTaxDate === date) return;
      running = true;
      try {
        console.log("[AUTOTAX] Running midnight tax collection...");
        lastTaxDate = date;
        const allUsers = await usersData.getAll();
        let taxed = 0;
        let totalCollected = 0;
        for (let i = 0; i < allUsers.length; i += 50) {
          const chunk = allUsers.slice(i, i + 50);
          await Promise.all(chunk.map(async (user) => {
            try {
              const uid = user.userID;
              const wallet = Math.max(0, Number(user.money) || 0);
              const bankInfo = await bankData.get(uid);
              const bank = Math.max(0, Number(bankInfo?.bankBalance) || 0);
              const total = wallet + bank;
              const tax = calcTax(total);
              if (tax <= 0) return;
              const fromWallet = Math.min(tax, wallet);
              const fromBank = tax - fromWallet;
              await usersData.set(uid, {
                money: wallet - fromWallet,
                data: { ...(user.data || {}), lastTaxPaid: tax, lastTaxDate: date }
              });
              if (fromBank > 0) {
                await bankData.set(uid, { ...(bankInfo || {}), bankBalance: bank - fromBank });
              }
              taxed++;
              totalCollected += tax;
            } catch (e) {
              console.error(`[AUTOTAX] Failed for ${user.userID}:`, e.message);
            }
          }));
        }
        console.log(`[AUTOTAX] Done: ${taxed} users taxed, $${totalCollected.toLocaleString()} collected (${date})`);
      } catch (e) {
        console.error("[AUTOTAX] Error:", e.message);
      } finally {
        running = false;
      }
    };
    setInterval(runTax, 60 * 1000);
    runTax();
  }
};
