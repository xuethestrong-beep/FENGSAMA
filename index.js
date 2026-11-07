const fs = require('fs-extra');
const login = require('ws3-fca');
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
} catch(e){
  console.log("[FENG] No cmds folder yet");
}

function startBot(appState) {
  login({ appState, ...config.fcaOptions }, (err, api) => {
    if (err) {
      console.error("[FENG] Login failed, retry in 10s", err.error || err);
      return setTimeout(() => startBot(appState), 10000);
    }

    console.log(`[FENG] LOGGED IN: ${api.getCurrentUserID()}`);
    console.log(`[FENG] Running - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`);

    // === REAL FIX FOR YOUR RED ERROR ===
    // 1. Disable the logger for reaction errors
    if (api._logger) {
      const oldError = api._logger.error;
      api._logger.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('setPostReaction')) return;
        return oldError(...args);
      };
    }

    // 2. Fully override broken methods (promise + callback support)
    api.setPostReaction = (postID, type, callback) => {
      if (callback) callback(null);
      return Promise.resolve(null);
    };
    api.setMessageReaction = (reaction, messageID, callback, force) => {
      if (callback) callback(null);
      return Promise.resolve(null);
    };

    api.listenMqtt((err, event) => {
      if (err) {
        if (err.error && err.error.includes('Not logged in')) {
          console.log("[FENG] Re-login needed...");
          return startBot(appState);
        }
        return;
      }
      
      if (event.type === 'message' || event.type === 'message_reply') {
        if (!event.body) return;
        // prevent bot responding to itself
        if (event.senderID === api.getCurrentUserID()) return;

        console.log(`[MSG] ${event.senderID}: ${event.body.slice(0,50)}`);

        const prefix = config.prefix || "!";
        if (!event.body.startsWith(prefix)) return;
        
        const args = event.body.slice(prefix.length).trim().split(/ +/);
        const name = args.shift().toLowerCase();
        const cmd = cmds.get(name);
        if (!cmd) return;
        
        try { 
          cmd.execute({ api, event, args, cmds, config, prefix }); 
        } catch(e){ 
          console.log(`[CMD ERROR] ${name}: ${e.message}`); 
        }
      }
    });
  });
}

let appState = null;
try {
  // Try 1: file (if you added volume)
  if (fs.existsSync('appstate.json')) {
    appState = JSON.parse(fs.readFileSync('appstate.json','utf8'));
    console.log(`[FENG] Loaded appstate from file (${appState.length} cookies)`);
  }
} catch(e) { console.log("[FENG] file read failed", e.message) }

if (!appState) {
  try {
    // Try 2: ENV (Railway)
    if (process.env.APPSTATE) {
      let raw = process.env.APPSTATE.trim();
      // Railway sometimes wraps it in quotes
      if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = JSON.parse(raw);
      }
      appState = typeof raw === 'string' ? JSON.parse(raw) : raw;
      console.log(`[FENG] Loaded appstate from ENV (${appState.length} cookies)`);
    }
  } catch(e) { console.log("[FENG] ENV parse failed:", e.message) }
}

if (!appState) {
  console.error("[FENG] No appstate found! Put appstate.json or APPSTATE env");
  console.error("[FENG] ENV exists?", !!process.env.APPSTATE, "Length:", process.env.APPSTATE?.length || 0);
  process.exit(1);
}

startBot(appState);
