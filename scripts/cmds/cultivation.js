const realms = ["Mortal", "Qi Condensation", "Foundation", "Golden Core", "Nascent Soul", "Soul Formation", "Void Refinement", "Great Ascension", "Immortal"];
const realmPower = [10, 50, 200, 800, 3200, 12000, 50000, 200000, 1000000];
const artifacts = { "wooden sword": { power: 20, price: 100 }, "spirit sword": { power: 150, price: 500 }, "dragon blade": { power: 800, price: 3000 }, "immortal relic": { power: 5000, price: 20000 } };
const pets = { "fox": { power: 100, price: 500 }, "phoenix": { power: 800, price: 5000 }, "kirin": { power: 5000, price: 25000 } };
const pills = { "qi pill": { qi: 50 }, "dragon pill": { qi: 200 } };
const beasts = [{ name: "Rabbit", power: 30, reward: 20 }, { name: "Wolf", power: 150, reward: 60 }, { name: "Tiger", power: 600, reward: 200 }, { name: "Serpent", power: 2500, reward: 800 }, { name: "Dragon", power: 15000, reward: 5000 }];
const HUNT_CD = 30000;
const DUNGEON_CD = 300000;
const DUNGEON_COST = 100;
const DUNGEON_REQ = 500;
const DUNGEON_REWARD = 500;
const DUEL_CD = 60000;

function isAdmin(senderID) {
  const admins = global.GoatBot?.config?.adminBot || global.config?.adminBot || [];
  return Array.isArray(admins) && admins.map(String).includes(String(senderID));
}
function getCult(d) {
  const base = { realm: 0, qi: 0, maxQi: 100, stones: 300, talent: +(Math.random() * 0.5 + 0.5).toFixed(2), lastCultivate: Date.now(), power: 10, wins: 0, loses: 0, artifact: null, sect: null, inventory: {}, pet: null, hunts: 0, lastHunt: 0, lastDungeon: 0, lastDuel: 0 };
  const saved = d?.data?.cultivation || {};
  return { ...base, ...saved, inventory: { ...base.inventory, ...(saved.inventory || {}) } };
}
function calcOffline(c) {
  const h = Math.min((Date.now() - c.lastCultivate) / 3600000, 24);
  if (h <= 0) return 0;
  const g = Math.floor(h * 12 * (c.realm + 1) * c.talent);
  c.qi = Math.min(c.maxQi, c.qi + g);
  c.lastCultivate = Date.now();
  return g;
}
function totalPower(c) {
  return (Number(c.power) || 0) + (c.artifact && artifacts[c.artifact] ? artifacts[c.artifact].power : 0) + (c.pet && pets[c.pet] ? pets[c.pet].power : 0);
}
async function saveCult(usersData, id, uData, cult) {
  await usersData.set(id, { data: { ...(uData?.data || {}), cultivation: cult } });
}

module.exports = {
  config: {
    name: "cultivation",
    aliases: ["cultivate", "tu"],
    version: "1.8.1-fixed",
    author: "ST",
    role: 0,
    countDown: 2,
    category: "game"
  },
  onStart: async function ({ message, event, args, usersData, api }) {
    const sub = (args[0] || "profile").toLowerCase();
    const s = event.senderID;
    let uData = await usersData.get(s);
    let cult = getCult(uData);
    const off = calcOffline(cult);
    const save = async () => await saveCult(usersData, s, uData, cult);
    const name = async (id) => await usersData.getName(id);

    if (["profile", "p", "me"].includes(sub)) {
      await save();
      const bar = Math.floor(cult.qi / cult.maxQi * 10);
      return message.reply(`⚔️ ${off ? `+${off} offline Qi` : ""}\n👤 ${await name(s)} | Sect: ${cult.sect || "Rogue"}\n🌟 ${realms[cult.realm]} (${cult.realm}/8) | 🔮 ${cult.talent}\n🗡️ ${cult.artifact || "None"} | 🐾 ${cult.pet || "None"} | ⚡ ${totalPower(cult)}\n💨 ${cult.qi}/${cult.maxQi} [${"█".repeat(bar)}${"░".repeat(10 - bar)}]\n💎 ${cult.stones} | 🏹 ${cult.hunts || 0} | W${cult.wins} L${cult.loses}`);
    }

    if (["break", "bt"].includes(sub)) {
      if (cult.qi < cult.maxQi) return message.reply(`Need ${cult.maxQi} Qi have ${cult.qi}`);
      const cost = Math.floor(cult.maxQi * 0.8);
      if (cult.stones < cost) return message.reply(`Need ${cost} stones`);
      if (cult.realm >= 8) return message.reply("Max Immortal");
      const num = Math.floor(Math.random() * 4) + 3;
      const seq = Array.from({ length: num }, () => Math.floor(Math.random() * 4) + 1);
      const info = await message.reply(`⛈️ TRIBULATION ${realms[cult.realm]}→${realms[cult.realm + 1]}\nCost ${cost} stones\nBlock ${num} lightnings! Reply ${num} numbers 1-4 separated by spaces\nExample: 1 2 3 4\n30s!`);
      cult.stones -= cost;
      cult.qi -= cult.maxQi;
      await save();
      if (info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: s, type: "tribulation", sequence: seq, cost, oldMax: cult.maxQi, expiresAt: Date.now() + 30000 });
      }
      return;
    }

    if (["hunt"].includes(sub)) {
      if (Date.now() - (cult.lastHunt || 0) < HUNT_CD) return message.reply(`⏳ Hunt cooldown: wait ${Math.ceil((HUNT_CD - (Date.now() - cult.lastHunt)) / 1000)}s`);
      const b = beasts[Math.min(cult.realm, beasts.length - 1)];
      const my = totalPower(cult) + Math.random() * 100;
      const en = b.power + Math.random() * 50;
      cult.lastHunt = Date.now();
      if (my > en) {
        cult.stones += b.reward;
        const pn = Object.keys(pills)[Math.floor(Math.random() * 2)];
        cult.inventory[pn] = (cult.inventory[pn] || 0) + 1;
        cult.qi = Math.min(cult.maxQi, cult.qi + 20);
        cult.hunts++;
        await save();
        return message.reply(`🏹 WIN ${b.name} +${b.reward} stones + ${pn}`);
      } else {
        cult.stones = Math.max(0, cult.stones - 10);
        await save();
        return message.reply(`💀 LOSE vs ${b.name} -10`);
      }
    }

    if (["dungeon", "dg"].includes(sub)) {
      if (Date.now() - (cult.lastDungeon || 0) < DUNGEON_CD) return message.reply(`⏳ Dungeon cooldown: wait ${Math.ceil((DUNGEON_CD - (Date.now() - cult.lastDungeon)) / 60000)}m`);
      const my = totalPower(cult);
      if (my <= DUNGEON_REQ) return message.reply(`💀 Need ${DUNGEON_REQ} power you ${Math.floor(my)}`);
      if (cult.stones < DUNGEON_COST) return message.reply(`Need ${DUNGEON_COST} stones to enter`);
      cult.lastDungeon = Date.now();
      cult.stones -= DUNGEON_COST;
      cult.stones += DUNGEON_REWARD;
      await save();
      return message.reply(`🏰 CLEAR -${DUNGEON_COST} +${DUNGEON_REWARD} stones (net +${DUNGEON_REWARD - DUNGEON_COST})`);
    }

    if (["artifact", "wp"].includes(sub)) {
      const n = args.slice(1).join(" ").toLowerCase();
      if (!n) {
        let l = "🗡️ SHOP\n";
        for (const [k, v] of Object.entries(artifacts)) l += `${k} +${v.power} - ${v.price}\n`;
        return message.reply(l);
      }
      const a = artifacts[n];
      if (!a) return message.reply("Not found");
      if (cult.stones < a.price) return message.reply(`Need ${a.price}`);
      cult.stones -= a.price;
      cult.artifact = n;
      await save();
      return message.reply(`Equipped ${n}`);
    }

    if (["pet"].includes(sub)) {
      const n = args.slice(1).join(" ").toLowerCase();
      if (!n) {
        let l = "🐾 PETS\n";
        for (const [k, v] of Object.entries(pets)) l += `${k} +${v.power} - ${v.price}\n`;
        return message.reply(l);
      }
      const p = pets[n];
      if (!p) return message.reply("No pet");
      if (cult.stones < p.price) return message.reply(`Need ${p.price}`);
      cult.stones -= p.price;
      cult.pet = n;
      await save();
      return message.reply(`🐾 ${n} +${p.power}`);
    }

    if (["inv", "bag"].includes(sub)) {
      let l = `🎒 BAG 💎 ${cult.stones}\n`;
      for (const [k, v] of Object.entries(cult.inventory)) l += `${k} x${v}\n`;
      if (!Object.keys(cult.inventory).length) l += "Empty hunt for pills";
      return message.reply(l);
    }

    if (["use"].includes(sub)) {
      const n = args.slice(1).join(" ").toLowerCase();
      if (!cult.inventory[n]) return message.reply("Don't have");
      const pill = pills[n];
      if (!pill) return message.reply("Cannot use that item");
      cult.inventory[n]--;
      if (cult.inventory[n] <= 0) delete cult.inventory[n];
      cult.qi = Math.min(cult.maxQi, cult.qi + pill.qi);
      await save();
      return message.reply(`💊 Used ${n} +${pill.qi} Qi ${cult.qi}/${cult.maxQi}`);
    }

    if (["trade", "give"].includes(sub)) {
      const tid = Object.keys(event.mentions || {})[0];
      const amt = parseInt(args[2], 10);
      if (!tid || !Number.isInteger(amt)) return message.reply("!cultivation trade @user 100");
      if (amt <= 0) return message.reply("Amount must be positive");
      if (String(tid) === String(s)) return message.reply("Cannot trade to yourself");
      if (cult.stones < amt) return message.reply("Not enough");
      const tData = await usersData.get(tid);
      let tCult = getCult(tData);
      cult.stones -= amt;
      tCult.stones += amt;
      await save();
      await saveCult(usersData, tid, tData, tCult);
      return message.reply(`💸 Gave ${amt} to ${await name(tid)}`);
    }

    if (sub === "daily") {
      const last = uData.data.lastDaily || 0;
      if (Date.now() - last < 86400000) return message.reply("Daily done 24h");
      let b = 100 + cult.realm * 30 + (cult.sect ? 50 : 0);
      cult.stones += b;
      await usersData.set(s, { data: { ...uData.data, lastDaily: Date.now(), cultivation: cult } });
      return message.reply(`🎁 Daily +${b}`);
    }

    if (["duel", "pk"].includes(sub)) {
      const tid = Object.keys(event.mentions || {})[0];
      if (!tid) return message.reply("Tag @");
      if (String(tid) === String(s)) return message.reply("Cannot duel yourself");
      if (Date.now() - (cult.lastDuel || 0) < DUEL_CD) return message.reply(`⏳ Duel cooldown: wait ${Math.ceil((DUEL_CD - (Date.now() - cult.lastDuel)) / 1000)}s`);
      const tData = await usersData.get(tid);
      let tCult = getCult(tData);
      calcOffline(tCult);
      const my = totalPower(cult) + cult.qi / 10 + Math.random() * 30;
      const en = totalPower(tCult) + tCult.qi / 10 + Math.random() * 30;
      cult.lastDuel = Date.now();
      if (my > en) {
        cult.wins++; cult.stones += 50; tCult.loses++; tCult.stones = Math.max(0, tCult.stones - 20);
      } else {
        cult.loses++; cult.stones = Math.max(0, cult.stones - 20); tCult.wins++; tCult.stones += 50;
      }
      await save();
      await saveCult(usersData, tid, tData, tCult);
      return message.reply(my > en ? `⚔️ WIN +50 vs ${await name(tid)}` : `💀 LOSE -20 vs ${await name(tid)}`);
    }

    if (["top"].includes(sub)) {
      const all = await usersData.getAll();
      const list = all.filter((u) => u.data.cultivation).map((u) => ({ name: u.name || "Unknown", realm: u.data.cultivation.realm || 0, tp: totalPower(getCult(u)) })).sort((a, b) => b.tp - a.tp).slice(0, 15);
      let m = "🏆 TOP 15\n";
      list.forEach((u, i) => m += `${i + 1}. ${u.name} ${realms[u.realm] || "Mortal"} ${u.tp}\n`);
      return message.reply(m);
    }

    if (sub === "sect") {
      const act = (args[1] || "").toLowerCase();
      if (act === "create") {
        const sn = args.slice(2).join(" ").trim() || `${await name(s)} Sect`;
        if (cult.stones < 200) return message.reply("Need 200");
        cult.stones -= 200; cult.sect = sn; await save(); return message.reply(`🏯 Created ${sn}`);
      }
      if (act === "join") {
        const sn = args.slice(2).join(" ").trim();
        if (!sn) return message.reply("sect join <name>");
        cult.sect = sn; await save(); return message.reply(`Joined ${sn}`);
      }
      if (act === "leave") {
        if (!cult.sect) return message.reply("Not in a sect");
        cult.sect = null; await save(); return message.reply("Left your sect");
      }
      return message.reply("sect create <name> | join <name> | leave");
    }

    if (["set", "edit", "admin"].includes(sub)) {
      if (!isAdmin(s)) return message.reply("⚠️ Admin only");
      const field = (args[1] || "").toLowerCase();
      let targetID = Object.keys(event.mentions || {})[0] || s;
      let tData = await usersData.get(targetID);
      let tCult = getCult(tData);
      const saveTarget = async () => await saveCult(usersData, targetID, tData, tCult);
      if (!field || field === "help") {
        return message.reply(`🔧 EDIT - ADMIN ONLY\n!cultivation set realm 0-8\n!cultivation set @user realm 5\n!cultivation set stones 99999\n!cultivation set qi 100\n!cultivation set maxqi 1000\n!cultivation set talent 1.5\n!cultivation set power 50000\n!cultivation set artifact dragon blade\n!cultivation set pet kirin\n!cultivation set sect MySect\n!cultivation set reset`);
      }
      if (field === "reset") {
        tCult = { realm: 0, qi: 0, maxQi: 100, stones: 300, talent: 0.8, lastCultivate: Date.now(), power: 10, wins: 0, loses: 0, artifact: null, sect: null, inventory: {}, pet: null, hunts: 0, lastHunt: 0, lastDungeon: 0, lastDuel: 0 };
        await saveTarget(); return message.reply(`✅ Reset ${await name(targetID)}`);
      }
      if (field === "realm") {
        const r = parseInt(args[2], 10);
        if (!Number.isInteger(r) || r < 0 || r > 8) return message.reply("Realm must be 0-8");
        tCult.realm = r; tCult.power = realmPower[r]; tCult.maxQi = Math.floor(100 * Math.pow(2.6, r));
        await saveTarget(); return message.reply(`✅ Set ${await name(targetID)} to ${realms[r]}`);
      }
      if (field === "stones") {
        const v = parseInt(args[2], 10);
        if (!Number.isInteger(v) || v < 0) return message.reply("Stones must be >= 0");
        tCult.stones = v; await saveTarget(); return message.reply(`✅ stones ${tCult.stones}`);
      }
      if (field === "qi") {
        const v = parseInt(args[2], 10);
        if (!Number.isInteger(v) || v < 0) return message.reply("Qi must be >= 0");
        tCult.qi = Math.min(tCult.maxQi, v); await saveTarget(); return message.reply(`✅ qi ${tCult.qi}`);
      }
      if (field === "maxqi") {
        const v = parseInt(args[2], 10);
        if (!Number.isInteger(v) || v <= 0) return message.reply("MaxQi must be > 0");
        tCult.maxQi = v; tCult.qi = Math.min(tCult.qi, v); await saveTarget(); return message.reply(`✅ maxqi ${tCult.maxQi}`);
      }
      if (field === "talent") {
        const v = parseFloat(args[2]);
        if (!Number.isFinite(v) || v < 0 || v > 5) return message.reply("Talent must be 0-5");
        tCult.talent = v; await saveTarget(); return message.reply(`✅ talent ${tCult.talent}`);
      }
      if (field === "power") {
        const v = parseInt(args[2], 10);
        if (!Number.isInteger(v) || v < 0) return message.reply("Power must be >= 0");
        tCult.power = v; await saveTarget(); return message.reply(`✅ power ${tCult.power}`);
      }
      if (field === "artifact") {
        const n = args.slice(2).join(" ").toLowerCase();
        if (n !== "none" && !artifacts[n]) return message.reply("Unknown artifact");
        tCult.artifact = n === "none" ? null : n; await saveTarget(); return message.reply(`✅ artifact ${n}`);
      }
      if (field === "pet") {
        const n = args.slice(2).join(" ").toLowerCase();
        if (n !== "none" && !pets[n]) return message.reply("Unknown pet");
        tCult.pet = n === "none" ? null : n; await saveTarget(); return message.reply(`✅ pet ${n}`);
      }
      if (field === "sect") {
        const n = args.slice(2).join(" ").trim();
        if (!n) return message.reply("Sect name required");
        tCult.sect = n; await saveTarget(); return message.reply(`✅ sect ${n}`);
      }
      return message.reply("Unknown field");
    }

    return this.onStart({ message, event, args: ["profile"], usersData, api });
  },

  onReply: async function ({ message, event, Reply, usersData, api }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    if (Reply.type !== "tribulation") return;

    // FIXED: clean all tribulation replies for this user
    if (global.GoatBot?.onReply) {
      for (const [key, val] of global.GoatBot.onReply.entries()) {
        if (String(val.author) === String(event.senderID) && val.type === "tribulation") {
          global.GoatBot.onReply.delete(key);
        }
      }
    }

    if (Reply.expiresAt && Date.now() > Reply.expiresAt) return message.reply("💥 Tribulation expired - 30s passed");

    const uData = await usersData.get(event.senderID);
    let cult = getCult(uData);
    const input = event.body.trim().split(/[\s,]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    let hits = 0;
    for (let i = 0; i < Math.min(input.length, Reply.sequence.length); i++) if (input[i] === Reply.sequence[i]) hits++;

    if (hits / Reply.sequence.length >= 0.7) {
      cult.realm = Math.min(8, cult.realm + 1);
      cult.maxQi = Math.floor(Reply.oldMax * 2.6);
      cult.power = realmPower[cult.realm];
      cult.qi = 0;
      await saveCult(usersData, event.senderID, uData, cult);
      if (cult.realm >= 2) {
        try { api.sendMessage(`🌟 ${await usersData.getName(event.senderID)} → ${realms[cult.realm]}!`, event.threadID); } catch (e) {}
      }
      return message.reply(`🔥 SURVIVED ${hits}/${Reply.sequence.length} → ${realms[cult.realm]} ⚡ ${cult.power}`);
    } else {
      cult.qi = Math.floor(Reply.oldMax * 0.2);
      cult.power = Math.max(10, cult.power - 20);
      cult.stones += Math.floor(Reply.cost * 0.5);
      await saveCult(usersData, event.senderID, uData, cult);
      return message.reply(`💥 FAILED ${hits}/${Reply.sequence.length} was ${Reply.sequence.join(" ")} - refund 50%`);
    }
  }
};
