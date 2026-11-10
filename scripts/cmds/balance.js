const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

function getLevelData(money) {
  const MAX = 99800100; // money for LV.999
  let prestige = Math.floor(money / MAX);
  let remaining = money % MAX;
  let level = Math.floor(Math.sqrt(remaining / 100)) + 1;
  if (level > 999) { level = 999; remaining = 0; }
  if (level < 1) level = 1;

  const cur = Math.pow(level - 1, 2) * 100;
  const next = Math.pow(level, 2) * 100;
  const percent = Math.max(0, Math.min(100, Math.floor(((remaining - cur) / (next - cur)) * 100)));
  const needed = next - remaining;

  let rank, color;
  if (prestige >= 10) { rank = "ETERNAL VOID"; color = "#ff0000"; }
  else if (prestige >= 5) { rank = "ETERNAL GOD"; color = "#ff006a"; }
  else if (prestige >= 3) { rank = "COSMIC EMPEROR"; color = "#ffd700"; }
  else if (prestige >= 1) { rank = "PRESTIGE LORD"; color = "#00e5ff"; }
  else if (level >= 700) { rank = "GOD"; color = "#ffd700"; }
  else if (level >= 300) { rank = "VAMPIRE KING"; color = "#8a2be2"; }
  else if (level >= 150) { rank = "VAMPIRE QUEEN"; color = "#9b59b6"; }
  else if (level >= 100) { rank = "OVERLORD"; color = "#3498db"; }
  else if (level >= 50) { rank = "KING"; color = "#e67e22"; }
  else if (level >= 20) { rank = "KNIGHT"; color = "#2ecc71"; }
  else { rank = "ALIVE"; color = "#95a5a6"; }

  return { level, prestige, rank, color, percent, needed, next, total: money, remaining };
}

module.exports = {
 config: { name: "balance", aliases: ["bal"], version: "10.0 FINAL", author: "FENG", countDown: 3, role: 0, category: "economy" },
 onStart: async function ({ message, event, usersData }) {
  try {
    const uid = event.senderID;
    const data = await usersData.get(uid);
    const money = data.money || 0;
    const { level, prestige, rank, color, percent, needed, next, total } = getLevelData(money);

    const canvas = createCanvas(850, 430);
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0,0,850,430);
    grad.addColorStop(0, "#0a0a0f"); grad.addColorStop(1, "#1e1433");
    ctx.fillStyle = grad; ctx.fillRect(0,0,850,430);

    try {
      let bg = null;
      const p1 = path.join(__dirname, "anibg.png");
      const p2 = path.join(__dirname, "luminous.png");
      if (await fs.pathExists(p1)) bg = await loadImage(p1);
      else if (await fs.pathExists(p2)) bg = await loadImage(p2);
      if (bg) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(bg, 470, 0, 380, 430);
        ctx.globalAlpha = 1;
      }
    } catch {}

    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(20,20,500,390,22); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(20,20,500,12);

    try {
      const av = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      ctx.save(); ctx.beginPath(); ctx.arc(85,85,52,0,Math.PI*2); ctx.clip();
      ctx.drawImage(av,33,33,104,104); ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(85,85,54,0,Math.PI*2); ctx.stroke();
    } catch {}

    let name = data.name || "User";
    if (name.length > 18) name = name.slice(0,18);

    ctx.fillStyle = "#111"; ctx.font = "bold 23px Arial"; ctx.fillText(name, 160, 75);
    ctx.fillStyle = color; ctx.font = "bold 12px Arial";
    if (prestige > 0) ctx.fillText(`✦ PRESTIGE ${prestige} • LV.${level} • ${rank} ✦`, 160, 100);
    else ctx.fillText(`✦ LV.${level} • ${rank} • ALIVE ✦`, 160, 100);
    ctx.fillStyle = "#888"; ctx.font = "10px Arial"; ctx.fillText(`UID: ${uid} • $${total.toLocaleString()} total`, 160, 120);

    ctx.fillStyle = "#999"; ctx.font = "bold 11px Arial"; ctx.fillText("CURRENT BALANCE", 40, 170);
    ctx.fillStyle = "#111"; ctx.font = "bold 36px Arial"; ctx.fillText(`$${money.toLocaleString()}`, 40, 210);
    ctx.fillStyle = color; ctx.font = "bold 13px Arial"; ctx.fillText(`≈ ¥${Math.floor(money*1.2).toLocaleString()}`, 40, 235);

    ctx.fillStyle = "#eee"; ctx.beginPath(); ctx.roundRect(40, 255, 420, 18, 9); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(40, 255, 420*(percent/100), 18, 9); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px Arial"; ctx.fillText(`${percent}%`, 230, 268);

    ctx.fillStyle = "#666"; ctx.font = "11px Arial";
    ctx.fillText(`LV.${level} → LV.${level === 999 ? "MAX" : level+1}`, 40, 295);
    ctx.fillText(`Need $${needed.toLocaleString()} for next LV`, 40, 312);
    ctx.fillText(`Next LV at $${next.toLocaleString()}`, 40, 329);

    ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.beginPath(); ctx.roundRect(40, 345, 420, 50, 12); ctx.fill();
    ctx.fillStyle = "#111"; ctx.font = "bold 10px Arial";
    ctx.fillText("RANK", 70, 365); ctx.fillText("LEVEL", 200, 365); ctx.fillText("PRESTIGE", 330, 365);
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = color; ctx.fillText(rank, 70, 383);
    ctx.fillStyle = "#111";
    ctx.fillText(prestige > 0 ? `P${prestige} LV.${level}` : `LV.${level}`, 200, 383);
    ctx.fillText(prestige > 0 ? `P${prestige} (${total.toLocaleString()})` : `P0`, 330, 383);

    const dir = path.join(__dirname, "tmp"); await fs.ensureDir(dir);
    const p = path.join(dir, `bal_${uid}.png`);
    await fs.writeFile(p, canvas.toBuffer("image/png"));
    return message.reply({ attachment: fs.createReadStream(p) });
  } catch (e) { console.log(e); return message.reply("Error: "+e.message); }
 }
};
