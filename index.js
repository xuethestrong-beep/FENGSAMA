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
    cmds.set(cmd.name || f.replace('.js',''), cmd);
  }
} catch(e){}

function startBot(appState) {
  login({ appState, ...config.fcaOptions }, (err, api) => {
    if (err) {
      console.error("[FENG] Login failed, retry in 10s", err.error || err);
      return setTimeout(() => startBot(appState), 10000);
    }

    console.log(`[FENG] LOGGED IN: ${api.getCurrentUserID()}`);
    console.log(`[FENG] Running - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`);

    // === FIX FOR YOUR ERROR - disable broken reaction ===
    api.setPostReaction = (a,b,c) => { if(c) c(null); };
    api.setMessageReaction = (a,b,c) => { if(c) c(null); };
    const originalDefaultFuncs = api.setPostReaction;
    
    api.listenMqtt((err, event) => {
      if (err) return;
      // log only messages, not spam presence
      if (event.type === 'message' || event.type === 'message_reply') {
        console.log(`[MSG] ${event.senderID}: ${event.body}`);
        
        if (!event.body) return;
        const prefix = config.prefix || "!";
        if (!event.body.startsWith(prefix)) return;

        const args = event.body.slice(1).trim().split(/ +/);
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

let appState;
if (process.env.APPSTATE) {
  appState = JSON.parse(process.env.APPSTATE);
} else {
  appState = JSON.parse(fs.readFileSync('appstate.json','utf8'));
}
startBot(appState);
