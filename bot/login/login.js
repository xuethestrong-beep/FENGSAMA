const fs = require("fs-extra");
const path = require("path");
// YOUR BOT USES @dongdev/fca-unofficial - not fca-unofficial
let login;
try {
  login = require("@dongdev/fca-unofficial");
} catch (e) {
  login = require("stfca");
}

module.exports = async function({ api, models, config }) {
  const accountPath = path.join(__dirname, "../../account.txt");

  function showExpired(msg) {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║   [ FBSTATE EXPIRED / INVALID ]                ║");
    console.log(`║   ${msg}`.substring(0,48).padEnd(49) + "║");
    console.log("║   Get new appstate and update account.txt      ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log("\n");
  }

  let appState = null;
  
  try {
    if (!fs.existsSync(accountPath)) {
      showExpired("account.txt NOT FOUND");
      throw new Error("FBSTATE EXPIRED - account.txt not found");
    }

    const rawData = fs.readFileSync(accountPath, "utf8").trim();
    
    if (!rawData || rawData.length < 100) {
      showExpired(`account.txt empty/too small: ${rawData.length}`);
      throw new Error("FBSTATE EXPIRED - account.txt empty");
    }

    try {
      appState = JSON.parse(rawData);
    } catch (parseErr) {
      if (rawData.includes("c_user=")) {
        showExpired("Cookie STRING not JSON ARRAY - Fix format");
        throw new Error("FBSTATE EXPIRED - Need JSON array format");
      } else {
        showExpired(`JSON parse failed`);
        throw new Error("FBSTATE EXPIRED - JSON invalid");
      }
    }

    if (!Array.isArray(appState)) {
      showExpired("account.txt is not Array");
      throw new Error("FBSTATE EXPIRED - Not array");
    }

    const hasCUser = appState.some(i => i.key === "c_user");
    const hasXs = appState.some(i => i.key === "xs");
    
    if (!hasCUser || !hasXs) {
      showExpired("Missing c_user/xs - Expired!");
      throw new Error("FBSTATE EXPIRED - Missing cookies");
    }

    console.log(` - Loaded account.txt: ${appState.length} cookies OK`);

  } catch (e) {
    if (e.message.includes("EXPIRED")) {
      showExpired(e.message);
      throw e;
    }
    console.log(" - Warning reading account.txt:", e.message);
  }

  // FIX FOR LINE 504 EMAIL ERROR
  const botAccount = config.botAccount || {};
  if (botAccount.autoUseWhenEmpty === true && (!botAccount.email || botAccount.email === "")) {
    console.log(" - autoUseWhenEmpty=true but email empty, using account.txt");
    botAccount.autoUseWhenEmpty = false;
  }

  return new Promise((resolve, reject) => {
    try {
      const options = {
        appState: appState,
        selfListen: true,
        listenEvents: true,
        updatePresence: true,
        autoMarkDelivery: false,
        autoMarkRead: false,
      };

      console.log(" - Login with cookie array");

      login(options, (err, api) => {
        if (err) {
          const errStr = (err.error || err.message || JSON.stringify(err)).toString().toLowerCase();
          if (errStr.includes("expired") || errStr.includes("checkpoint") || errStr.includes("login") || errStr.includes("403")) {
            showExpired(`Facebook rejected: ${err.error || err.message}`);
          } else {
            console.error(" - Login failed:", err);
          }
          return reject(err);
        }

        console.log(` - Logged in as: ${api.getCurrentUserID()}`);
        resolve(api);
      });

    } catch (error) {
      showExpired(error.message);
      reject(error);
    }
  });
};
