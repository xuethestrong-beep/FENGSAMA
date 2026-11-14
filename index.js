const { spawn, execSync } = require("child_process");
const log = require("./logger/log.js");
const fs = require("fs");

const OWNER_UID = "61593117279214";
const ACCOUNT_FILES = ["./appstate.json", "./appstate2.json", "./appstate3.json"];
let currentAccountIndex = 0;

const REBRAND = [
  [/ST Bot - Enhanced version of GoatBot V2, modified and maintained by Sheikh Tamim\./g, "Mysteriousq AI Bot - Custom fork maintained by Siegfried Samá."],
  [/\[!\] The source code should only be downloaded from the official github page:[^\n]*/g, "[!] Custom bot maintained by Siegfried Samá."],
  [/\[!\] Thank you for using ST Bot\. Enhanced by Sheikh Tamim[^\n]*/g, "[!] Mysteriousq AI Bot — maintained by Siegfried Samá."],
  [/COPYRIGHT: ST Bot v[\d.]+ - Enhanced by Sheikh Tamim[^\n]*/g, "COPYRIGHT: Mysteriousq AI Bot — maintained by Siegfried Samá. All rights reserved."],
  [/ST Bot v[\d.]+/g, "Mysteriousq AI Bot"],
  [/ST-Bot/g, "Mysteriousq AI Bot"],
  [/ST Bot/g, "Mysteriousq AI Bot"],
  [/Sheikh Tamim/g, "Siegfried Samá"],
];
function applyRebrand(text) {
  for (const [pattern, replacement] of REBRAND) text = text.replace(pattern, replacement);
  return text;
}

function getNextValidAccount() {
  for (let i = 0; i < ACCOUNT_FILES.length; i++) {
    const idx = (currentAccountIndex + i) % ACCOUNT_FILES.length;
    const file = ACCOUNT_FILES[idx];
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        if (data && data.length > 5) { currentAccountIndex = idx; return file; }
      } catch {}
    }
  }
  return null;
}

// SEND FB NOTIFY USING BACKUP ACCOUNT
async function notifyOwner(switchedFrom) {
  try {
    const login = require("./fb-chat-api") || require("fb-chat-api");
    const appState = JSON.parse(fs.readFileSync("./appstate.json", "utf8"));
    login({ appState }, { logLevel: "silent" }, (err, api) => {
      if (err) return;
      const msg = `⚠️ [AUTO-SWITCH] Main account expired!\nSwitched from: ${switchedFrom}\nNow using: appstate.json\nTime: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}\nPlease get new backup soon!`;
      api.sendMessage(msg, OWNER_UID, () => api.logout());
    });
  } catch (e) { console.log("Notify failed:", e.message); }
}

function prepareAccount() {
  const validFile = getNextValidAccount();
  if (!validFile) return { ok: false, file: null };
  if (validFile !== "./appstate.json") {
    const from = ACCOUNT_FILES[(currentAccountIndex - 1 + ACCOUNT_FILES.length) % ACCOUNT_FILES.length] || "appstate.json";
    log.info(`[SWITCHER] Main expired, switching ${validFile} -> appstate.json`);
    try { fs.copyFileSync(validFile, "./appstate.json"); } catch {}
    // Send FB notification
    setTimeout(() => notifyOwner(from), 5000);
  }
  log.info(`[SWITCHER] Using account: ${validFile}`);
  return { ok: true, file: validFile };
}

function killOrphans() {
  try { execSync("pkill -9 -f 'node Goat.js'", { stdio: "ignore" }); } catch (_) {}
  try { execSync("fuser -k 3021/tcp", { stdio: "ignore" }); } catch (_) {}
}
let currentChild = null; let isShuttingDown = false;
function killChild() { if (currentChild) { try { currentChild.kill("SIGKILL"); } catch (_) {} currentChild = null; } }
function shutdown() { if (isShuttingDown) return; isShuttingDown = true; killChild(); try { execSync("pkill -9 -f 'node Goat.js'", { stdio: "ignore" }); } catch (_) {} process.exit(0); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown); process.on("exit", killChild);

function startProject() {
  if (isShuttingDown) return;
  const prep = prepareAccount();
  if (!prep.ok) { log.err("index", "No valid account, retry 30s"); setTimeout(() => startProject(), 30000); return; }
  const child = spawn(process.execPath, ["-r", require.resolve("./gban-fail-open.js"), "Goat.js"], { cwd: __dirname, stdio: ["inherit", "pipe", "pipe"], });
  currentChild = child;
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    if (text.includes("Not logged in") || text.includes("Error retrieving userID") || text.includes("login-approval") || text.includes("Account is disabled")) {
      log.err("SWITCHER", "Expired detected, switching...");
      killChild(); currentAccountIndex = (currentAccountIndex + 1) % ACCOUNT_FILES.length; setTimeout(() => startProject(), 3000); return;
    }
    process.stdout.write(applyRebrand(text));
  });
  child.stderr.on("data", (chunk) => { process.stderr.write(applyRebrand(chunk.toString())); });
  child.on("close", (code) => { if (isShuttingDown) return; currentChild = null; log.info(`Bot stopped (code: ${code}). Restarting 5s...`); setTimeout(() => startProject(), 5000); });
  child.on("error", (err) => { if (isShuttingDown) return; currentChild = null; log.err("index", `Failed: ${err.message}. Restart 5s`); setTimeout(() => startProject(), 5000); });
}
killOrphans(); startProject();
