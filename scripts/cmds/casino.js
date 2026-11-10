module.exports = {
  config: {
    name: "casino",
    aliases: ["csn", "gamble"],
    version: "1.1",
    author: "FENG",
    countDown: 5,
    role: 0,
    description: "Full casino - slots, blackjack, roulette, dice, coinflip",
    category: "economy",
    guide: "{pn} slots <bet|all>\n{pn} bj <bet|all>\n{pn} roulette <bet|all> <red/black/number>\n{pn} dice <bet|all> <1-6>\n{pn} coinflip <bet|all> <heads/tails>"
  },
  onStart: async function ({ args, message, event, usersData }) {
    try {
      const uid = event.senderID;
      const userData = await usersData.get(uid) || {};
      let money = Math.max(0, Number(userData.money) || 0);
      const game = (args[0] || "").toLowerCase();
      const save = async (newMoney) => {
        await usersData.set(uid, { money: newMoney, data: userData.data || {} });
      };
      if (!game) {
        return message.reply(
          `🎰 CASINO\n──────────────\n` +
          `💰 Balance: $${money.toLocaleString()}\n\n` +
          `Games:\n` +
          `• casino slots <bet> - 3 matching symbols\n` +
          `• casino bj <bet> - blackjack vs dealer (auto-stand)\n` +
          `• casino roulette <bet> <red/black/0-36>\n` +
          `• casino dice <bet> <1-6> - guess dice\n` +
          `• casino coinflip <bet> <heads/tails>\n\n` +
          `Ex: casino slots 1000`
        );
      }
      const betRaw = (args[1] || "").toLowerCase();
      const MAX_BET = 50000;
      const MIN_BET = 100;
      let bet = 0;
      if (betRaw === "all") bet = money;
      else bet = Number(String(betRaw).replace(/[,]/g, ""));
      if (!Number.isInteger(bet) || bet <= 0) return message.reply(`❌ Enter bet: casino ${game} <amount|all>`);
      if (money < bet) return message.reply(`❌ You only have $${money.toLocaleString()}`);
      if (bet < MIN_BET) return message.reply(`❌ Min bet $${MIN_BET.toLocaleString()}`);
      if (bet > MAX_BET) return message.reply(`❌ Max bet $${MAX_BET.toLocaleString()}`);
      if (game === "slots" || game === "slot") {
        const symbols = ["🍒", "🍋", "🍊", "💎", "7️⃣", "🔔", "🍀"];
        const r1 = symbols[Math.floor(Math.random() * symbols.length)];
        const r2 = symbols[Math.floor(Math.random() * symbols.length)];
        const r3 = symbols[Math.floor(Math.random() * symbols.length)];
        let win = 0;
        let msg = `🎰 [ ${r1} | ${r2} | ${r3} ]\n`;
        if (r1 === r2 && r2 === r3) {
          if (r1 === "💎" || r1 === "7️⃣") win = bet * 10;
          else if (r1 === "🍀") win = bet * 5;
          else win = bet * 3;
          msg += `🎉 JACKPOT! Won $${win.toLocaleString()}`;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
          win = bet;
          msg += `✨ Small win! +$${win.toLocaleString()}`;
        } else {
          win = -bet;
          msg += `💸 Lost $${bet.toLocaleString()}`;
        }
        const newMoney = money + win;
        await save(newMoney);
        return message.reply(msg + `\n💵 Balance: $${newMoney.toLocaleString()}`);
      }
      if (game === "bj" || game === "blackjack" || game === "21") {
        const deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
        const draw = () => deck[Math.floor(Math.random() * deck.length)];
        const p = draw() + draw();
        const d = draw() + draw();
        let win = 0;
        let result = "";
        if (p > 21 && d > 21) {
          win = -bet;
          result = `🃏 You: ${p} Dealer: ${d} BOTH BUST!\n💸 Lost $${bet.toLocaleString()}`;
        } else if (p === 21 && d !== 21) {
          win = Math.floor(bet * 1.5);
          result = `🃏 BLACKJACK! You: 21 Dealer: ${d}\n🎉 Won $${win.toLocaleString()}`;
        } else if (p > 21) {
          win = -bet;
          result = `🃏 You: ${p} BUST! Dealer: ${d}\n💸 Lost $${bet.toLocaleString()}`;
        } else if (d > 21) {
          win = bet;
          result = `🃏 You: ${p} Dealer: ${d} BUST!\n✅ Won $${win.toLocaleString()}`;
        } else if (p > d) {
          win = bet;
          result = `🃏 You: ${p} Dealer: ${d}\n✅ Won $${win.toLocaleString()}`;
        } else if (p === d) {
          win = 0;
          result = `🃏 You: ${p} Dealer: ${d}\n🤝 Push - no loss`;
        } else {
          win = -bet;
          result = `🃏 You: ${p} Dealer: ${d}\n💸 Lost $${bet.toLocaleString()}`;
        }
        const newMoney = money + win;
        await save(newMoney);
        return message.reply(result + `\n💵 Balance: $${newMoney.toLocaleString()}`);
      }
      if (game === "roulette" || game === "r") {
        const pick = (args[2] || "").toLowerCase();
        if (!pick) return message.reply(`❌ casino roulette <bet> <red/black/green/0-36>\nEx: casino roulette 500 red`);
        const num = Math.floor(Math.random() * 37);
        const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
        const color = num === 0 ? "green" : isRed ? "red" : "black";
        let win = 0;
        let result = `🎡 Roulette: ${num} ${color}\n`;
        if (pick === color) {
          win = color === "green" ? bet * 14 : bet;
          result += `✅ Color hit! Won $${win.toLocaleString()}`;
        } else if (!isNaN(Number(pick)) && Number(pick) === num) {
          win = bet * 35;
          result += `🎉 NUMBER JACKPOT! Won $${win.toLocaleString()} (35x)`;
        } else {
          win = -bet;
          result += `💸 Lost - you picked ${pick}`;
        }
        const newMoney = money + win;
        await save(newMoney);
        return message.reply(result + `\n💵 Balance: $${newMoney.toLocaleString()}`);
      }
      if (game === "dice") {
        const guess = Number(args[2]);
        if (!guess || guess < 1 || guess > 6) return message.reply(`❌ casino dice <bet> <1-6>\nEx: casino dice 500 3`);
        const roll = Math.floor(Math.random() * 6) + 1;
        let win = 0;
        let result = `🎲 Dice rolled: ${roll}\n`;
        if (roll === guess) {
          win = Math.floor(bet * 4.5);
          result += `🎉 Exact! Won $${win.toLocaleString()} (4.5x)`;
        } else {
          win = -bet;
          result += `💸 Lost - you guessed ${guess}`;
        }
        const newMoney = money + win;
        await save(newMoney);
        return message.reply(result + `\n💵 Balance: $${newMoney.toLocaleString()}`);
      }
      if (game === "coinflip" || game === "cf" || game === "flip") {
        const pick = (args[2] || "").toLowerCase();
        if (!["heads", "tails", "h", "t"].includes(pick)) return message.reply(`❌ casino coinflip <bet> <heads/tails>\nEx: casino coinflip 500 heads`);
        const flip = Math.random() < 0.5 ? "heads" : "tails";
        const normalizedPick = pick.startsWith("h") ? "heads" : "tails";
        let win = 0;
        let result = `🪙 Flip: ${flip}\n`;
        if (flip === normalizedPick) {
          win = Math.floor(bet * 0.9);
          result += `✅ Won $${win.toLocaleString()}`;
        } else {
          win = -bet;
          result += `💸 Lost $${bet.toLocaleString()}`;
        }
        const newMoney = money + win;
        await save(newMoney);
        return message.reply(result + `\n💵 Balance: $${newMoney.toLocaleString()}`);
      }
      return message.reply(`❌ Unknown game ${game}\nUse: slots, bj, roulette, dice, coinflip`);
    } catch (e) {
      console.error("[CASINO] Error:", e.message);
      return message.reply("❌ Casino failed. Try again.");
    }
  }
};
