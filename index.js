const { spawn, execSync } = require("child_process");
const fs = require("fs");
const log = require("./logger/log.js");

const OWNER_UID = "61593117279214";
const ACCOUNT_FILES = ["./account.txt", "./account2.txt", "./account3.txt"];
let currentIndex = 0;

function getValid() {
  for (let i = 0; i < ACCOUNT_FILES.length; i++) {
    const idx = (currentIndex + i) % ACCOUNT_FILES.length;
    const f = ACCOUNT_FILES[idx];
    if (fs.existsSync(f)) {
      try {
        const d = JSON.parse(fs.readFileSync(f, "utf8"));
        if (d && d.length > 5) { currentIndex = idx; return f; }
      } catch {}
    }
  }
  return null;
}

function prepare() {
  const valid = getValid();
  if (!valid) { log.err("SWITCHER", "No valid account.txt"); return false; }
  if (valid !== "./account.txt") {
    console.log(`[SWITCHER] Main expired, using ${valid} -> account.txt`);
    fs.copyFileSync(valid, "./account.txt");
    // Also sync to appstate.json for safety
    fs.copyFileSync(valid, "./appstate.json");
  }
  return true;
}

let child = null;
function start() {
  if (!prepare()) { setTimeout(start, 10000); return; }
  child = spawn(process.execPath, ["-r", require.resolve("./gban-fail-open.js"), "Goat.js"], { cwd: __dirname, stdio: "inherit" });
  child.on("close", (code) => { console.log(`Bot died code ${code}, restarting...`); currentIndex = (currentIndex + 1) % ACCOUNT_FILES.length; setTimeout(start, 5000); });
}
try { execSync("pkill -9 -f 'node Goat.js'", { stdio: "ignore" }); } catch {}
start();
