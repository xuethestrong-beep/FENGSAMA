const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "5.1 - Luminous - Railway",
    author: "FENG",
    countDown: 5,
    role: 0,
    description: "Luminous Valentine balance card",
    category: "economy"
  },
  onStart: async function ({ message, usersData, event, api }) {
    const makeCard = async (uid, name, money) => {
      const canvas = createCanvas(1000, 450);
      const ctx = canvas.getContext("2d");

      const bg = ctx.createLinearGradient(0,0,1000,450);
      bg.addColorStop(0, "#1a0b2e");
      bg.addColorStop(1, "#3d1f5c");
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,1000,450);

      ctx.fillStyle = "rgba(255,255,255,0.93)";
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(25,25,670,400,28);
      else { ctx.rect(25,25,670,400); }
      ctx.fill();

      try {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 225, 82, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(avatar, 43, 143, 164, 164);
        ctx.restore();
        ctx.strokeStyle = "#8a2be2";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(125,225,85,0,Math.PI*2);
        ctx.stroke();
      } catch {}

      ctx.fillStyle = "#1a0b2e";
      ctx.font = "bold 32px Sans";
      ctx.fillText(name.slice(0,20), 240, 175);

      ctx.fillStyle = "#8a2be2";
      ctx.font = "bold 48px Sans";
      ctx.fillText(`$${Number(money).toLocaleString()}`, 240, 245);

      ctx.fillStyle = "#777";
      ctx.font = "bold 15px Sans";
      ctx.fillText("LUMINOUS VALENTINE • VAMPIRE QUEEN", 240, 280);

      try {
        const lumPath = path.join(__dirname, "luminous.png");
        if(await fs.pathExists(lumPath)){
          const lum = await loadImage(lumPath);
          ctx.drawImage(lum, 650, 10, 360, 440);
        }
      } catch {}

      const tmp = path.join(__dirname, "tmp", `${uid}_luminous.png`);
      await fs.ensureDir(path.join(__dirname, "tmp"));
      await fs.writeFile(tmp, canvas.toBuffer("image/png"));
      return tmp;
    };

    const data = await usersData.get(event.senderID);
    const info = await api.getUserInfo(event.senderID);
    const name = info[event.senderID].name;
    const p = await makeCard(event.senderID, name, data.money);
    return message.reply({ 
      body: `🌙 Luminous Balance: $${data.money}`, 
      attachment: fs.createReadStream(p) 
    });
  }
};
