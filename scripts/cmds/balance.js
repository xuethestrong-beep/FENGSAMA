const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

function getRankTitle(level, tier) {
  if (tier === 5) return "☠️ ETERNAL VOID";
  if (tier === 4) return "👑 GOD VAMPIRE QUEEN";
  if (tier === 3) return "❄️ OVERLORD";
  if (tier === 2) return "🦇 VAMPIRE KING";
  if (level >= 100) return "👑 LEGEND";
  if (level >= 50) return "💎 DIAMOND";
  if (level >= 30) return "🏆 GOLD";
  if (level >= 15) return "🥈 SILVER";
  if (level >= 5) return "🥉 BRONZE";
  return "🌱 ALIVE";
}

function getTier(level, money) {
  const prestige = Math.floor(money / 99800100);
  if (prestige >= 1 || level >= 700) return 5;
  if (level >= 300) return 4;
  if (level >= 100) return 3;
  if (level >= 50) return 2;
  return 1;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

module.exports = {
 config: { name: "balance", aliases: ["bal"], version: "2.5 TIER + ANIME", author: "FENG", countDown: 2, role: 0, category: "economy" },
 onStart: async function ({ message, event, usersData }) {
  const uid = event.senderID;
  const dir = path.join(__dirname, "tmp");
  const out = path.join(dir, `bal_${uid}_${Date.now()}_${crypto.randomUUID()}.png`);
  let readStream = null;
  try {
    const userData = await usersData.get(uid);
    const name = userData.name || "User";
    let money = Math.max(0, Number(userData.money) || 0);
    let level = Math.floor(Math.sqrt(money / 100)) + 1;
    if (level > 999) level = 999;

    const tier = getTier(level, money);
    const rankTitle = getRankTitle(level, tier);
    
    const currentLevelCost = Math.pow(level - 1, 2) * 100;
    const nextLevelCost = Math.pow(level, 2) * 100;
    const progress = Math.min(1, (money - currentLevelCost) / (nextLevelCost - currentLevelCost || 1));

    // Tier background priority: bg_tier{}.png > luminous.png
    let bgPath = path.join(__dirname, `bg_tier${tier}.png`);
    if (!await fs.pathExists(bgPath)) bgPath = path.join(__dirname, "luminous.png");
    if (!await fs.pathExists(bgPath)) return message.reply(`MISSING ${bgPath} - add luminous.png`);

    const bg = await loadImage(bgPath);
    const W = bg.width || 1280; const H = bg.height || 853;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, W, H);

    // Tier color glow
    const tierColors = { 1: "#4ade80", 2: "#a855f7", 3: "#38bdf8", 4: "#d4b36a", 5: "#ff0033" };
    const color = tierColors[tier];

    ctx.fillStyle = "rgba(0,0,0,0.58)";
    roundRect(ctx, 60, 60, 760, H - 120, 35); ctx.fill();
    ctx.strokeStyle = color + "88"; ctx.lineWidth = 4; ctx.stroke();

    // Avatar with tier color border
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 8000 });
      const avatar = await loadImage(Buffer.from(res.data));
      const ax = 140, ay = 140, ar = 90;
      ctx.save(); ctx.beginPath(); ctx.arc(ax+ar, ay+ar, ar, 0, Math.PI*2); ctx.closePath(); ctx.clip();
      ctx.drawImage(avatar, ax, ay, ar*2, ar*2); ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(ax+ar, ay+ar, ar+3, 0, Math.PI*2); ctx.stroke();
    } catch {}

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 58px sans-serif";
    ctx.fillText(name.length > 14 ? name.slice(0,14)+"…" : name, 360, 210);
    ctx.fillStyle = color; ctx.font = "bold 30px sans-serif";
    ctx.fillText(`${rankTitle} • LV.${level} • TIER ${tier}/5`, 360, 260);

    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 24px sans-serif";
    ctx.fillText("TOTAL BALANCE", 140, 430);
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 78px sans-serif";
    ctx.fillText(`$${money.toLocaleString()}`, 140, 510);

    // Progress bar with tier color
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundRect(ctx, 140, 560, 600, 22, 11); ctx.fill();
    if (progress > 0) {
      ctx.fillStyle = color;
      roundRect(ctx, 140, 560, Math.max(22, 600*progress), 22, 11); ctx.fill();
    }
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 22px sans-serif";
    ctx.fillText(`${Math.floor(progress*100)}% to LV.${level+1} • Need $${(nextLevelCost-money).toLocaleString()}`, 140, 625);

    await fs.ensureDir(dir);
    await fs.writeFile(out, canvas.toBuffer("image/png"));
    readStream = fs.createReadStream(out);
    await new Promise((res, rej) => {
      message.reply({ body: `💰 ${name} | $${money.toLocaleString()} | ${rankTitle}`, attachment: readStream }, (e) => e?rej(e):res());
    });
  } catch (err) {
    console.error("[BAL] Error:", err.message);
    try { await message.reply("❌ Failed to generate balance card."); } catch {}
  } finally {
    if (readStream) try { readStream.destroy(); } catch {}
    try { await fs.unlink(out); } catch {}
  }
 }
};
