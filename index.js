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
      return setTimeout(() => startBot(appState), 60000); 
    } 
    console.log(`[FENG] LOGGED IN: ${api.getCurrentUserID()}`); 
    api.setOptions({ selfListen: false, listenEvents: true, updatePresence: false }); 
    api.setPostReaction = () => Promise.resolve(null); 
    api.setMessageReaction = () => Promise.resolve(null); 

    const keepAlive = setInterval(() => { 
      try { api.markAsReadAll(() => {}); } catch(e){} 
      console.log(`[FENG] KeepAlive ping - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`); 
    }, 8 * 60 * 1000); 

    const forceRestart = setTimeout(() => { 
      console.log("[FENG] 45min pro-active restart to avoid FB block"); 
      clearInterval(keepAlive); 
      try { api.logout(); } catch(e){} 
      safeRestart(appState, 5000, "45min rotation"); 
    }, 45 * 60 * 1000); 

    const listener = api.listenMqtt((err, event) => { 
      if (err) { 
        clearInterval(keepAlive); 
        clearTimeout(forceRestart); 
        const msg = JSON.stringify(err); 
        if (msg.includes('Not logged in')) { 
          return safeRestart(appState, 10000, "Not logged in"); 
        } 
        if (msg.includes('Server unavailable') || msg.includes('Connection refused')) { 
          return safeRestart(appState, 60000 + Math.random()*30000, "Server unavailable - Railway IP blocked"); 
        } 
        return safeRestart(appState, 20000, "MQTT Error"); 
      } 

      if (event.type === 'message' || event.type === 'message_reply') { 
        if (!event.body || event.senderID == api.getCurrentUserID()) return;

        // --- NO PREFIX + HI REPLY ---
        const body = event.body.trim();
        const lowerBody = body.toLowerCase();

        if (lowerBody === "hi" || lowerBody === "hello" || lowerBody === "hey") {
          return api.sendMessage("hello, wanna listen to music 🎶🎵\nJust type: music [song name]", event.threadID);
        }

        const prefix = config.prefix || "!";
        let commandBody = body;
        if (body.startsWith(prefix)) {
          commandBody = body.slice(prefix.length).trim();
        }
        // now works with OR without prefix
        const args = commandBody.split(/ +/);
        const name = args.shift().toLowerCase(); 
        const cmd = cmds.get(name); 
        if (!cmd) return; 
        try { 
          cmd.execute({ api, event, args, cmds, config, prefix }); 
        } catch(e){ 
          console.log(`[CMD ERROR] ${e.message}`); 
        } 
      } 
    }); 
  }); 
} 

let appState = null; 
try { 
  if (fs.existsSync('appstate.json')) appState = JSON.parse(fs.readFileSync('appstate.json','utf8')); 
} catch(e){} 
if (!appState) { 
  try { 
    if (process.env.APPSTATE) { 
      let raw = process.env.APPSTATE.trim(); 
      if (raw.startsWith('"') && raw.endsWith('"')) raw = JSON.parse(raw); 
      appState = typeof raw === 'string' ? JSON.parse(raw) : raw; 
    } 
  } catch(e){ console.log("[FENG] ENV parse failed", e.message) } 
} 
if (!appState) { 
  console.error("[FENG] No appstate"); 
  process.exit(1); 
} 
startBot(appState);
