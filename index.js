const fs = require('fs-extra');
const login = require('ws3-fca');
const config = require('./config.json');

console.log("[FENG] Starting clean...");

const cmds = new Map();
for (const f of fs.readdirSync('./scripts/cmds')) {
 if(!f.endsWith('.js')) continue;
 try{ const c=require(`./scripts/cmds/${f}`); cmds.set(c.name,c); }catch(e){}
}

function start(appState){
 login({ appState, ...config.fcaOptions }, (err, api)=>{
  if(err) return console.error("Login failed", err);
  console.log("[FENG] LOGGED IN:", api.getCurrentUserID());
  
  api.listenMqtt((err, event)=>{
    if(err) return;
    console.log("[EVENT]", event.type, event.body || "");
    if(!event.body) return;
    if(!event.body.startsWith(config.prefix)) return;
    
    const args = event.body.slice(1).split(/ +/);
    const name = args.shift().toLowerCase();
    const cmd = cmds.get(name);
    if(cmd) cmd.execute({ api, event, args, config }).catch(e=>console.log(e));
  });
 });
}

let appState = JSON.parse(process.env.APPSTATE || fs.readFileSync('appstate.json','utf8'));
start(appState);
