const fs = require('fs-extra');
const ws3fca = require('ws3-fca');
const login = ws3fca.login || ws3fca.default || ws3fca;
const config = require('./config.json');

console.log("[FENG] Starting...");

const cmds = new Map();
try {
  for (const f of fs.readdirSync('./scripts/cmds')) {
    if (!f.endsWith('.js')) continue;
    const cmd = require(`./scripts/cmds/${f}`);
    cmds.set(cmd.config?.name || cmd.name || f.replace('.js',''), cmd);
  }
  console.log(`[FENG] Loaded ${cmds.size} commands`);
} catch(e){ console.log("[FENG] No cmds:", e.message); }

let restarting = false;
let currentListener = null;
let keepAlive = null;

function safeRestart(appState, delay = 30000, reason = "") {
  if (restarting) return;
  restarting = true;
  console.log(`[FENG] Restarting in ${delay/1000}s - ${reason}`);
  try { if (currentListener) currentListener(); } catch(e){}
  if (keepAlive) clearInterval(keepAlive);
  setTimeout(() => { restarting = false; startBot(appState); }, delay);
}

function startBot(appState) {
  login({ appState, ...config.fcaOptions }, (err, api) => {
    if (err) {
      console.error("[FENG] Login failed:", err.error || err);
      const msg = (JSON.stringify(err) + (err.error||'')).toLowerCase();
      if (msg.includes('retrieving userid') || msg.includes('unknown location') || msg.includes('checkpoint')) {
        console.error("[FENG] APPSTATE expired/blocked.");
        return setTimeout(() => startBot(appState), 15 * 60 * 1000);
      }
      return setTimeout(() => startBot(appState), 60000);
    }
    console.log(`[FENG] LOGGED IN: ${api.getCurrentUserID()}`);
    api.setOptions({ selfListen: false, listenEvents: true, updatePresence: false, autoMarkDelivery: false, autoMarkRead: false, online: false });
    
    keepAlive = setInterval(() => {
      console.log(`[FENG] Alive - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`);
    }, 15 * 60 * 1000);

    currentListener = api.listenMqtt((err, event) => {
      if (err) {
        clearInterval(keepAlive);
        const m = JSON.stringify(err);
        console.error("[FENG] MQTT Error:", m);
        if (m.includes('Not logged in')) return safeRestart(appState, 15000, "Not logged in");
        if (m.includes('Server unavailable')) return safeRestart(appState, 90000, "Server unavailable");
        return safeRestart(appState, 30000, "MQTT Error");
      }
      if (event.type !== 'message' && event.type !== 'message_reply') return;
      if (!event.body || event.senderID == api.getCurrentUserID()) return;

      const body = event.body.trim();
      const lowerBody = body.toLowerCase();

      const reply = (text) => {
        return new Promise((res, rej) => {
          api.sendMessage(text, event.threadID, (e, i) => e ? rej(e) : res(i), event.messageID);
        });
      };

      if (["hi","hello","hey"].includes(lowerBody)) {
        return reply("hello, wanna listen to music 🎶🎵\nJust type: !music [song name]").catch(()=>{});
      }

      const prefix = config.prefix || "!";
      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const name = args.shift().toLowerCase();
      const cmd = cmds.get(name);
      if (!cmd) return;

      try { cmd.execute({ api, event, args, cmds, config, prefix, reply }); }
      catch(e){ reply(`Error: ${e.message}`).catch(()=>{}); }
    });
  });
}

let appState = null;
try {
  if (fs.existsSync('appstate.json')) {
    appState = JSON.parse(fs.readFileSync('appstate.json','utf8'));
    console.log("[FENG] Loaded from appstate.json");
  }
} catch(e){}
if (!appState) {
  try {
    let raw = process.env.FBSTATE || process.env.APPSTATE;
    if (raw) {
      raw = raw.trim();
      if (raw.startsWith('"') && raw.endsWith('"')) { try { raw = JSON.parse(raw); } catch(e){} }
      appState = typeof raw === 'string' ? JSON.parse(raw) : raw;
      console.log("[FENG] Loaded appstate from ENV");
    }
  } catch(e){ console.log("[FENG] ENV parse failed:", e.message); }
}
if (!appState) { console.error("[FENG] No appstate found."); process.exit(1); }
startBot(appState);
