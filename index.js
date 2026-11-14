// index.js
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const log = require("./logger/log.js");
const OWNER_UID = "61593117279214";
const ACCOUNT_FILES = ["./account.txt", "./account2.txt", "./account3.txt"];
let currentIndex = 0;
function getValid() {
  for (let i = 0; i < ACCOUNT_FILES.length; i++) {
    const idx = (currentIndex + i) % ACCOUNT_FILES.length;
    const f = ACCOUNT_FILES[idx];
    if (!fs.existsSync(f)) continue;
    try {
      const raw = fs.readFileSync(f, "utf8").trim();
      const d = JSON.parse(raw);
      if (Array.isArray(d) && d.length > 5) {
        currentIndex = idx;
        return f;
      }
    } catch (e) {
      log.warn("SWITCHER", `Invalid account file ${f}, skipping`);
    }
  }
  return null;
}
function prepare() {
  const valid = getValid();
  if (!valid) {
    log.err("SWITCHER", "No valid account file found in account.txt / account2.txt / account3.txt");
    return false;
  }
  if (valid !== "./account.txt") {
    console.log(`[SWITCHER] Main account.txt invalid/expired, using ${valid}`);
    if (!fs.existsSync("./account.backup.txt")) {
      try { fs.copyFileSync("./account.txt", "./account.backup.txt"); } catch {}
    }
    fs.copyFileSync(valid, "./account.txt");
  }
  return true;
}
let child = null;
let isRestarting = false;
function start() {
  if (!prepare()) {
    setTimeout(start, 10000);
    return;
  }
  child = spawn(process.execPath, ["-r", require.resolve("./gban-fail-open.js"), "Goat.js"], {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env, OWNER_UID }
  });
  child.on("close", (code) => {
    if (isRestarting) return;
    isRestarting = true;
    console.log(`Bot died code ${code}, trying next account in 5s...`);
    currentIndex = (currentIndex + 1) % ACCOUNT_FILES.length;
    setTimeout(() => { isRestarting = false; start(); }, 5000);
  });
  child.on("error", (err) => {
    log.err("SWITCHER", `Failed to start bot: ${err.message}`);
  });
}
start();
