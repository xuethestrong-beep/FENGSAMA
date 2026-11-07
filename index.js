const fs = require('fs-extra');
const path = require('path');
const login = require('ws3-fca');
const config = require('./config.json');

fs.ensureDirSync(path.join(__dirname, 'cache'));
fs.ensureDirSync(path.join(__dirname, 'scripts/cmds'));

if (global.gc) setInterval(() => global.gc(), 3 * 60 * 1000);

const cmds = new Map();
const cmdsPath = path.join(__dirname, 'scripts/cmds');
for (const file of fs.readdirSync(cmdsPath)) {
  if (!file.endsWith('.js')) continue;
  const cmd = require(path.join(cmdsPath, file));
  cmds.set(cmd.name, cmd);
  console.log(`[FENG] + ${cmd.name}`);
}

let appState;
if (process.env.APPSTATE) {
  appState = JSON.parse(process.env.APPSTATE);
} else {
  appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
}

login({ appState }, config.fcaOptions, (err, api) => {
  if (err) return console.error(err);
  console.log(`[FENG] Running - ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`);
  fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

  api.listenMqtt(async (err, event) => {
    if (err || event.type !== 'message' || !event.body) return;
    if (!event.body.startsWith(config.prefix)) return;

    const args = event.body.slice(config.prefix.length).trim().split(/ +/);
    const name = args.shift().toLowerCase();
    const cmd = cmds.get(name);
    if (!cmd) return;

    try {
      await cmd.execute({ api, event, args, cmds, config });
    } catch (e) {
      console.error(e);
    }
    if (global.gc) global.gc();
  });
});
