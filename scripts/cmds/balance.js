const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

function getLevel(money) {
  if (!isFinite(money)) money = 10;
  money = Math.floor(money);
  const MAX = 99800100;
  let prestige = Math.floor(money / MAX);
  let remaining = money % MAX;
  let level = Math.floor(Math.sqrt(remaining / 100)) + 1;
  if (level > 999) level = 999;
  if (level < 1) level = 1;
  const cur = Math.pow(level - 1, 2) * 100;
  const next = Math.pow(level, 2) * 100;
  const need = next - remaining;
  const perc = Math.floor(((remaining - cur) / (next - cur)) * 100);
  return { prestige, level, remaining, need, perc, next };
}

module.exports = {
 config: { name: "balance", aliases: ["bal"], version: "13.1 WITH LEVEL", author: "FENG", countDown: 3, role: 0, category: "economy" },
 onStart: async function ({ message, event, usersData }) {
  try {
    const uid = event.senderID;
    const userData = await usersData.get(uid);
    let money = userData.money || 0;
    if (!isFinite(money) || money < 0) { money = 10; await usersData.set(uid, { money }); }

    const { prestige, level, need, perc } = getLevel(money);
    const points = level * 124 + prestige * 2500;

    const canvas = createCanvas(1920, 1280);
    const ctx = canvas.getContext("2d");

    let bgPath = path.join(__dirname, "luminous.png");
    if (!await fs.pathExists(bgPath)) bgPath = path.join(__dirname, "anibg.png");
    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, 1920, 1280);

    let name = (userData.name || "User").replace(/[^\x00-\x7F]/g, "").toUpperCase();
    if (name.length > 22) name = name.slice(0,22);

    // NAME
    ctx.fillStyle = "#f5e6c8";
    ctx.font = "bold 42px serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 445, 320);

    // RANK + LEVEL - NOW SHOWS LEVEL
    let rank = "ALIVE";
    if (prestige >= 10) rank = "ETERNAL VOID";
    else if (prestige >= 5) rank = "ETERNAL GOD";
    else if (prestige >= 3) rank = "COSMIC EMPEROR";
    else if (prestige >= 1) rank = "PRESTIGE LORD";
    else if (level >= 700) rank = "GOD";
    else if (level >= 300) rank = "VAMPIRE QUEEN";
    else if (level >= 100) rank = "OVERLORD";
    else if (level >= 50) rank = "VAMPIRE KING";

    ctx.fillStyle = "#d4b36a";
    ctx.font = "22px serif";
    if (prestige > 0) ctx.fillText(`— ${rank} — P${prestige} LV.${level}`, 445, 365);
    else ctx.fillText(`— ${rank} — LV.${level}`, 445, 365);

    // BALANCE
    ctx.fillStyle = "#ffeaa0";
    ctx.font = "bold 90px serif";
    ctx.shadowColor = "#ffb700"; ctx.shadowBlur = 20;
    ctx.fillText(`$${Number(money).toLocaleString()}`, 445, 545);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#a89bc8";
    ctx.font = "18px sans-serif";
    ctx.fillText(`LV.${level} • ${perc}% TO NEXT • NEED $${Number(need).toLocaleString()}`, 445, 595);
    ctx.fillText("AVAILABLE BALANCE", 445, 625);

    // CREDIT LIMIT (your total wealth) & POINTS (level points)
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8e0f0";
    ctx.font = "bold 48px serif";
    ctx.fillText(`LV.${level}`, 225, 820); // LEFT BOX NOW LEVEL
    
    ctx.fillText(`${points.toLocaleString()} PT`, 670, 820);

    ctx.fillStyle = "#a89bc8";
    ctx.font = "16px sans-serif";
    ctx.fillText("LEVEL", 225, 860);
    ctx.fillText("POINTS", 670, 860);

    // CARD NO + VALID THRU + LEVEL AT BOTTOM
    const last4 = uid.slice(-4);
    ctx.textAlign = "left";
    ctx.fillStyle = "#d0c6c6";
    ctx.font = "28px monospace";
    ctx.fillText(`**** **** **** ${last4}`, 130, 1050);

    ctx.font = "22px sans-serif";
    ctx.fillText(`${perc}% • 04/28`, 130, 1165);

    ctx.textAlign = "right";
    ctx.font = "18px serif";
    ctx.fillStyle = "#c8b8a0";
    ctx.fillText(`RIMURU BANK • ${rank} • LV-${String(level).padStart(3,"0")} • P${prestige}`, 1820, 1175);

    const dir = path.join(__dirname, "tmp"); await fs.ensureDir(dir);
    const out = path.join(dir, `bal_${uid}.png`);
    await fs.writeFile(out, canvas.toBuffer("image/png"));
    return message.reply({ attachment: fs.createReadStream(out) });
  } catch (e) { console.log(e); return message.reply("Error: "+e.message); }
 }
};
