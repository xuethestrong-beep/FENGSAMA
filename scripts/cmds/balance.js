const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

function getLevel(money) {
  if (!isFinite(money)) money = 0;
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
  const perc = Math.max(0, Math.min(99, Math.floor(((remaining - cur) / (next - cur)) * 100)));
  return { prestige, level, need, perc };
}

module.exports = {
 config: { name: "balance", aliases: ["bal"], version: "13.2 DYNAMIC", author: "FENG", countDown: 2, role: 0, category: "economy" },
 onStart: async function ({ message, event, usersData }) {
  const uid = event.senderID;
  const data = await usersData.get(uid);
  let money = data.money || 0;
  if (!isFinite(money) || money < 0) money = 0;

  const { prestige, level, need, perc } = getLevel(money);
  const points = level * 124 + prestige * 2500;

  try {
    const canvas = createCanvas(1280, 853);
    const ctx = canvas.getContext("2d");

    // THIS is your card image - must be in same folder
    const bgPath = path.join(__dirname, "luminous.png");
    if (!await fs.pathExists(bgPath)) {
      return message.reply("❌ Missing luminous.png - Put your card image in scripts/cmds/luminous.png");
    }

    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, 1280, 853);

    // DARK OVERLAY FOR TEXT
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(200, 210, 340, 420);

    // NAME - centered
    let name = (data.name || "USER").replace(/[^\x00-\x7F]/g, "").toUpperCase();
    if (name.length > 18) name = name.slice(0,18);
    ctx.fillStyle = "#f5e6c8";
    ctx.font = "bold 26px serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 370, 235);

    // LEVEL / RANK
    let rank = "VAMPIRE QUEEN";
    if (prestige > 0) rank = `P${prestige} ${rank}`;
    ctx.fillStyle = "#d4b36a";
    ctx.font = "14px serif";
    ctx.fillText(`${rank} • LV.${level}`, 370, 255);

    // DYNAMIC BALANCE - THIS WILL CHANGE
    ctx.fillStyle = "#ffeaa0";
    ctx.font = "bold 52px serif";
    ctx.shadowColor = "#ffb700"; ctx.shadowBlur = 12;
    ctx.fillText(`¥${Number(money).toLocaleString()}`, 370, 365);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#a89bc8";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${perc}% TO NEXT • NEED ¥${Number(need).toLocaleString()}`, 370, 390);

    // BOTTOM BOXES
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8e0f0";
    ctx.font = "bold 20px serif";
    ctx.fillText(`¥${Number(money*4+1000000).toLocaleString()}`, 275, 485);
    ctx.fillText(`${points.toLocaleString()} PT`, 470, 485);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#d0c6c6";
    ctx.textAlign = "left";
    ctx.fillText(`**** **** **** ${uid.slice(-4)}`, 185, 615);

    const dir = path.join(__dirname, "tmp");
    await fs.ensureDir(dir);
    const out = path.join(dir, `bal_${uid}.png`);
    await fs.writeFile(out, canvas.toBuffer("image/png"));
    return message.reply({ attachment: fs.createReadStream(out) });

  } catch (e) {
    console.log(e);
    return message.reply("❌ bal error: " + e.message + "\nMake sure you have canvas installed");
  }
 }
};
