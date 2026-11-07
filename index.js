const fs = require('fs-extra');
const ws3fca = require('ws3-fca');
const login = ws3fca.login || ws3fca.default || ws3fca;
const config = require('./config.json');

console.log("[FENG] Starting...");

// Load commands
const cmds = new Map();
try {
  for (const f of fs.readdirSync('./scripts/cmds')) {
    if (!f.endsWith('.js')) continue;
    const cmd = require(`./scripts/cmds/${f}`);
    cmds.set(cmd.config?.name || cmd.name || f.replace('.js',''), cmd);
  }
  console.log(`[FENG] Loaded ${cmds.size} commands`);
} catch(e){}

let restarting = false;
function safeRestart(appState, delay = 30000, reason = "") {
  if (restarting) return;
  restarting = true;
  console.log(`[FENG] Restarting in ${delay/1000}s - ${reason}`);
  setTimeout(() => {
    restarting = false;
    startBot(appState);
  }, delay);
}

function startBot(appState) {
  login({ appState, ...config.fcaOptions }, (err, api) => {
    if (err) {
      console.error("[FENG] Login failed:", err.error || err);
      const msg = (JSON.stringify(err) + (err.error||'')).toLowerCase();
      if (msg.includes('retrieving userid') || msg.includes('unknown location') || msg.includes('checkpoint')) {
        console.error("[FENG] APPSTATE expired/blocked. Get fresh APPSTATE manually.");
        return setTimeout(() => startBot(appState), 15 * 60 * 1000);
      }
      return setTimeout(() => startBot(appState), 60000);
    }

    console.log(`[FENG] LOGGED IN: ${api.getCurrentUserID()}`);
    api.setOptions({ 
      selfListen: false, 
      listenEvents: true, 
      updatePresence: false,
      autoMarkDelivery: false,
      autoMarkRead: false
    });

    const keepAlive = setInterval(() => {
      try { api.getCurrentUserID(); } catch(e){}
      console.log(`[FENG] Alive - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`);
    }, 15 * 60 * 1000);

    const listener = api.listenMqtt((err, event) => {
      if (err) {
        clearInterval(keepAlive);
        const m = JSON.stringify(err);
        console.error("[FENG] MQTT Error:", m);
        if (m.includes('Not logged in')) return safeRestart(appState, 15000, "Not logged in");
        if (m.includes('Server unavailable')) return safeRestart(appState, 90000, "Server unavailable");
        return safeRestart(appState, 30000, "MQTT Error");
      }

      if (event.type === 'message' || event.type === 'message_reply') {
        if (!event.body || event.senderID == api.getCurrentUserID()) return;

        const body = event.body.trim();
        const lowerBody = body.toLowerCase();

        // reply function - this makes bot reply TO their message
        const reply = (text) => {
          return api.sendMessage(text, event.threadID, event.messageID);
        };

        // No prefix hi/hello
        if (lowerBody === "hi" || lowerBody === "hello" || lowerBody === "hey") {
          return reply("hello, wanna listen to music 🎶🎵\nJust type: !music [song name]");
        }

        // If someone replied to bot's message
        if (event.type === 'message_reply' && event.messageReply) {
          if (event.messageReply.senderID == api.getCurrentUserID()) {
            // someone replied to your bot
            console.log(`[FENG] Someone replied to bot: ${body}`);
            // return reply("you replied to me, what's up?");
          }
        }

        const prefix = config.prefix || "!";
        let commandBody = body;
        if (body.startsWith(prefix)) {
          commandBody = body.slice(prefix.length).trim();
        }

        const args = commandBody.split(/ +/);
        const name = args.shift().toLowerCase();
        const cmd = cmds.get(name);
        if (!cmd) return;

        try { 
          // pass reply to commands
          cmd.execute({ api, event, args, cmds, config, prefix, reply }); 
        } catch(e){ 
          console.log(`[CMD ERROR] ${e.message}`); 
          reply(`Error: ${e.message}`);
        }
      }
    });
  });
}

// Load APPSTATE / FBSTATE
let appState = null;
try {
  if (fs.existsSync('appstate.json')) {
    appState = JSON.parse(fs.readFileSync('appstate.json','utf8'));
    console.log("[FENG] Loaded from appstate.json");
  }
} catch(e){}

if (!appState) {
  try {
    let raw = process.env.FBSTATE || process.env.APPSTATE || process.env.FB_STATE || process.env.APP_STATE;
    if (raw) {
      raw = raw.trim();
      if (raw.startsWith('"') && raw.endsWith('"')) {
        try { raw = JSON.parse(raw); } catch(e){}
      }
      appState = typeof raw === 'string' ? JSON.parse(raw) : raw;
      console.log("[FENG] Loaded appstate from ENV");
    }
  } catch(e){ 
    console.log("[FENG] ENV parse failed:", e.message);
  }
}

if (!appState) {
  console.error("[FENG] No appstate found. Set APPSTATE in Railway");
  process.exit(1);
}

startBot(appState);
