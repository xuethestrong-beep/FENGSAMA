const fs = require("fs-extra");
const path = require("path");
const { config } = global.GoatBot;
const { client } = global;

const cacheDir = path.join(__dirname, "cache");
const whitePath = path.join(cacheDir, "adminonly_whitelist.json");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(whitePath)) fs.writeJsonSync(whitePath, []);

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["adonly", "onlyad", "onlyadmin"],
    version: "1.6",
    author: "NIGG + FengSama",
    countDown: 5,
    role: 2,
    description: "turn on/off only admin can use bot + per GC whitelist",
    category: "owner",
    guide: "{pn} [on | off]: global adminonly\n{pn} gc [on | off]: allow everyone in THIS GC even if global is ON\n{pn} noti [on | off]: notification"
  },
  langs: {
    en: {
      turnedOn: "Turned on the mode only admin can use bot (GLOBAL)",
      turnedOff: "Turned off the mode only admin can use bot (GLOBAL)",
      turnedOnNoti: "Turned on the notification when user is not admin use bot",
      turnedOffNoti: "Turned off the notification when user is not admin use bot",
      gcOn: "✅ This GC is now WHITELISTED: Everyone can use bot here even if global adminonly is ON",
      gcOff: "✅ This GC removed from whitelist: Now follows global setting",
      list: "Global: %1\nThis GC Whitelisted: %2\n\n!adminonly on/off = global\n!adminonly gc on/off = only this GC"
    }
  },
  onStart: function ({ args, message, event, getLang }) {
    const threadID = event.threadID;
    let whitelist = [];
    try { whitelist = fs.readJsonSync(whitePath); } catch { whitelist = []; }

    // GC MODE: !adminonly gc on / off
    if (args[0]?.toLowerCase() === "gc") {
      if (args[1] === "on") {
        if (!whitelist.includes(threadID)) {
          whitelist.push(threadID);
          fs.writeJsonSync(whitePath, whitelist);
        }
        return message.reply(getLang("gcOn"));
      }
      if (args[1] === "off") {
        whitelist = whitelist.filter(id => id != threadID);
        fs.writeJsonSync(whitePath, whitelist);
        return message.reply(getLang("gcOff"));
      }
      const isWhite = whitelist.includes(threadID) ? "YES" : "NO";
      return message.reply(getLang("list", config.adminOnly.enable ? "ON" : "OFF", isWhite));
    }

    let isSetNoti = false;
    let value;
    let indexGetVal = 0;
    if (args[0] == "noti") {
      isSetNoti = true;
      indexGetVal = 1;
    }
    if (args[indexGetVal] == "on") value = true;
    else if (args[indexGetVal] == "off") value = false;
    else {
      const isWhite = whitelist.includes(threadID) ? "YES" : "NO";
      return message.reply(getLang("list", config.adminOnly.enable ? "ON" : "OFF", isWhite));
    }

    if (isSetNoti) {
      config.hideNotiMessage.adminOnly = !value;
      message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
    } else {
      config.adminOnly.enable = value;
      message.reply(getLang(value ? "turnedOn" : "turnedOff"));
    }
    fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
  },

  // This allows whitelisted GC to use bot even when global adminonly ON
  onChat: async function ({ api, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, message }) {
    try {
      if (!event.body) return;
      const { config } = global.GoatBot;
      if (!config.adminOnly.enable) return; // If global OFF, do nothing

      const threadID = event.threadID;
      let whitelist = [];
      try { whitelist = fs.readJsonSync(whitePath); } catch { whitelist = []; }
      
      if (!whitelist.includes(threadID)) return; // Not whitelisted, keep blocked

      const isBotAdmin = global.GoatBot.config.adminBot.map(String).includes(String(event.senderID));
      if (isBotAdmin) return;

      const prefix = global.GoatBot.config.prefix || "!";
      if (!event.body.startsWith(prefix)) return;

      const cmdName = event.body.slice(prefix.length).split(" ")[0].toLowerCase();
      const cmd = global.GoatBot.commands.get(cmdName);
      if (!cmd || cmd.config.name === "adminonly") return;

      // Whitelisted GC -> force run command for normal users
      const args = event.body.slice(prefix.length).trim().split(/ +/).slice(1);
      await cmd.onStart({
        api, event, args, message,
        threadsData, usersData, dashBoardData, globalData,
        threadModel, userModel, dashBoardModel, globalModel,
        role: 0,
        commandName: cmdName
      });
    } catch (e) {
      console.log(e);
    }
  }
};
