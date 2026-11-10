const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

function getRank(money) {
  if (money >= 5000000) return { rank: "GOD", level: 99, color: "#ffd700" };
  if (money >= 1000000) return { rank: "VAMPIRE QUEEN", level: 90, color: "#8a2be2" };
  if (money >= 500000) return { rank: "KING", level: 75, color: "#e74c3c" };
  if (money >= 100000) return { rank: "LORD", level: 50, color: "#3498db" };
  if (money >= 25000) return { rank: "KNIGHT", level: 25, color: "#2ecc71" };
  if (money >= 5000) return { rank: "COMMONER", level: 10, color: "#95a5a6" };
  return { rank: "PEASANT", level: 1, color: "#7f8c8d" };
}

module.exports = {
 config: { name: "balance", aliases: ["bal"], version: "7.0", author: "FENG", countDown: 3, role: 0, category: "economy" },
 onStart: async function ({ message, usersData, event }) {
  const uid = event.senderID;
  const userData = await usersData.get(uid);
  const money = userData.money || 0;
  const { rank, level, color } = getRank(money);

  let avatar, luminous;
  try {
    avatar = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  } catch {}
  const lumPath = path.join(__dirname, "luminous.png");
  if (await fs.pathExists(lumPath)) {
    try { luminous = await loadImage(lumPath); } catch {}
  }

  const canvas = createCanvas(800, 450);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0,0,800,450);
  grad.addColorStop(0, "#0f0a1e"); grad.addColorStop(1, "#25123d");
  ctx.fillStyle = grad; ctx.fillRect(0,0,800,450);

  if (luminous) {
    ctx.drawImage(luminous, 420, 0, 380, 450);
    const fade = ctx.createLinearGradient(420,0,520,0);
    fade.addColorStop(0, "rgba(15,10,30,1)"); fade.addColorStop(1, "rgba(15,10,30,0)");
    ctx.fillStyle = fade; ctx.fillRect(420,0,100,450);
  }

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.beginPath(); ctx.roundRect(20,20,420,410,24); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(20,20,420,8,4); ctx.fill();

  if (avatar) {
    ctx.save(); ctx.beginPath(); ctx.arc(95,110,58,0,Math.PI*2); ctx.clip();
    ctx.drawImage(avatar,37,52,116,116); ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(95,110,60,0,Math.PI*2); ctx.stroke();
  }

  let name = "User";
  try {
    const info = await new Promise(r => global.GoatBot?.fbApi?.getUserInfo(uid, (e,d)=>r(d)));
    if(info && info[uid]) name = info[uid].name;
  } catch {}
  if(name.length>18) name = name.slice(0,18)+"..";

  ctx.fillStyle = "#1a0b2e"; ctx.font = "bold 24px Arial"; ctx.fillText(name, 175, 95);
  ctx.fillStyle = color; ctx.font = "bold 11px Arial"; ctx.fillText(`✦ ${rank} • LUMINOUS END`, 175, 118);
  ctx.fillStyle = "#666"; ctx.font = "10px Arial"; ctx.fillText("UID: "+uid, 175, 136);

  ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(40,180,380,1);

  ctx.fillStyle = "#999"; ctx.font = "bold 11px Arial"; ctx.fillText("CURRENT BALANCE", 40, 210);
  ctx.fillStyle = "#1a0b2e"; ctx.font = "bold 42px Arial"; ctx.fillText(`$${Number(money).toLocaleString()}`, 40, 260);
  ctx.fillStyle = color; ctx.font = "bold 13px Arial"; ctx.fillText(`≈ ¥${Math.floor(money*1.2).toLocaleString()}`, 40, 285);

  // Dynamic stats box
  ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.beginPath(); ctx.roundRect(40,310,380,80,14); ctx.fill();
  ctx.fillStyle = "#1a0b2e"; ctx.font = "bold 10px Arial";
  ctx.fillText("RANK", 70, 335); ctx.fillText("LEVEL", 195, 335); ctx.fillText("STATUS", 310, 335);
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = color; ctx.fillText(rank, 70, 360);
  ctx.fillStyle = "#1a0b2e"; ctx.fillText(`LV.${level}`, 195, 360);
  ctx.fillStyle = money>0 ? "#2ecc71" : "#e74c3c"; ctx.fillText(money>0 ? "● RICH" : "● BROKE", 310, 360);

  ctx.fillStyle = "#aaa"; ctx.font = "9px Arial"; ctx.fillText(`${money.toLocaleString()} coins needed for next rank`, 70, 378);

  const dir = path.join(__dirname, "tmp"); await fs.ensureDir(dir);
  const p = path.join(dir, `bal_${uid}.png`);
  await fs.writeFile(p, canvas.toBuffer("image/png"));
  return message.reply({ attachment: fs.createReadStream(p) });
 }
};
