// Built-in badwords - auto detect
const DEFAULT_BADWORDS = [
  // English
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "nigga", "nigger",
  // Tagalog
  "gago", "tanga", "bobo", "inutil", "ulol", "gaga", "tarantado",
  "pakyu", "pakshet", "putangina", "puta", "kantot", "shet",
  "buwisit", "leche", "peste", "hayop", "pokpok"
];

function hideWord(str) {
  if (!str) return "";
  if (str.length <= 1) return "*";
  if (str.length === 2) return str[0] + "*";
  return str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[0@]/g, "a")
    .replace(/1!/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5\$/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/\+/g, "t")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/[^a-z0-9 ]/g, " ");
}

function findBadWord(message, wordList) {
  const tokens = normalizeText(message).split(/\s+/).filter(Boolean);
  const normalizedList = wordList.map(w => normalizeText(w));
  for (const token of tokens) {
    const idx = normalizedList.indexOf(token);
    if (idx !== -1) return wordList[idx];
  }
  return null;
}

async function getSettings(threadsData, threadID) {
  try {
    const data = await threadsData.get(threadID, "badwords", null);
    if (data && typeof data === "object") {
      return {
        enabled: data.enabled !== false,
        custom: Array.isArray(data.custom) ? data.custom : [],
        warnings: data.warnings && typeof data.warnings === "object" ? data.warnings : {}
      };
    }
  } catch {}
  return { enabled: true, custom: [], warnings: {} };
}

async function saveSettings(threadsData, threadID, settings) {
  try { await threadsData.set(threadID, "badwords", settings); } catch {}
}

function getAllWords(settings) {
  const seen = new Set();
  const out = [];
  for (const w of [...DEFAULT_BADWORDS, ...settings.custom]) {
    const lower = String(w).toLowerCase().trim();
    if (lower && !seen.has(lower)) { seen.add(lower); out.push(lower); }
  }
  return out;
}

module.exports = {
  config: {
    name: "badwords",
    aliases: ["badword", "autobad"],
    version: "2.1",
    author: "FENG",
    countDown: 3,
    role: 1,
    description: "Auto detect badwords without setup",
    category: "box chat",
    guide: "{pn} on/off - turn on/off\n{pn} list - show list\n{pn} add <words> - add more\n{pn} del <words> - delete\n{pn} unwarn @user - remove warning"
  },

  langs: {
    en: {
      turnedOn: "✅ | Auto badwords detection is ON - will auto detect %1 words",
      turnedOff: "✅ | Auto badwords detection is OFF",
      list: "📑 | Auto detecting %1 words: %2",
      warned: "⚠️ | Bad word \"%1\" detected, 1st warning. Next time you will be kicked.",
      warned2: "⚠️ | Bad word \"%1\" detected again, you violated 2 times and will be kicked.",
      needAdmin: "Bot needs admin to kick.",
      unwarned: "✅ | Removed warning of user %1 | %2",
      notWarned: "⚠️ | User %1 has no warning",
      missingTarget: "⚠️ | Tag or reply to user",
      added: "✅ | Added %1 words",
      deleted: "✅ | Deleted %1 words",
      alreadyExists: "⚠️ | %1 already in list",
      notFound: "⚠️ | %1 not found in list",
      noWords: "⚠️ | Please provide words",
      cannotKickAdmin: "⚠️ | Cannot kick a group admin."
    }
  },

  onStart: async function ({ api, event, args, threadsData, getLang }) {
    const { threadID, messageID, messageReply, mentions } = event;
    const sub = String(args[0] || "").toLowerCase();
    const settings = await getSettings(threadsData, threadID);

    if (sub === "on") {
      settings.enabled = true;
      await saveSettings(threadsData, threadID, settings);
      return api.sendMessage(getLang("turnedOn", getAllWords(settings).length), threadID, messageID);
    }

    if (sub === "off") {
      settings.enabled = false;
      await saveSettings(threadsData, threadID, settings);
      return api.sendMessage(getLang("turnedOff"), threadID, messageID);
    }

    if (sub === "list") {
      const words = getAllWords(settings).map(hideWord);
      return api.sendMessage(getLang("list", words.length, words.join(", ")), threadID, messageID);
    }

    if (sub === "add" || sub === "del") {
      const raw = args.slice(1).join(" ").split(/[\s,]+/).map(s => s.toLowerCase().trim()).filter(Boolean);
      if (!raw.length) return api.sendMessage(getLang("noWords"), threadID, messageID);

      if (sub === "add") {
        const added = [];
        for (const w of raw) {
          if (getAllWords(settings).includes(w)) continue;
          if (DEFAULT_BADWORDS.includes(w)) continue;
          settings.custom.push(w);
          added.push(hideWord(w));
        }
        await saveSettings(threadsData, threadID, settings);
        if (!added.length) return api.sendMessage(getLang("alreadyExists", raw.map(hideWord).join(", ")), threadID, messageID);
        return api.sendMessage(getLang("added", added.join(", ")), threadID, messageID);
      }

      const removed = [];
      for (const w of raw) {
        const idx = settings.custom.indexOf(w);
        if (idx !== -1) { settings.custom.splice(idx, 1); removed.push(hideWord(w)); }
      }
      await saveSettings(threadsData, threadID, settings);
      if (!removed.length) return api.sendMessage(getLang("notFound", raw.map(hideWord).join(", ")), threadID, messageID);
      return api.sendMessage(getLang("deleted", removed.join(", ")), threadID, messageID);
    }

    if (sub === "unwarn") {
      let targetID = null;
      let targetName = "";
      if (messageReply) {
        targetID = messageReply.senderID;
        targetName = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID];
      }
      if (!targetID) return api.sendMessage(getLang("missingTarget"), threadID, messageID);
      if (!settings.warnings[targetID]) return api.sendMessage(getLang("notWarned", targetName), threadID, messageID);
      delete settings.warnings[targetID];
      await saveSettings(threadsData, threadID, settings);
      return api.sendMessage(getLang("unwarned", targetName, targetID), threadID, messageID);
    }

    return api.sendMessage(
      `Usage:\n${this.config.guide.replaceAll("{pn}", "badwords")}`,
      threadID, messageID
    );
  },

  onChat: async function ({ api, event, threadsData, getLang }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body || !threadID || !senderID) return;
    if (String(senderID) === String(api.getCurrentUserID())) return;

    const settings = await getSettings(threadsData, threadID);
    if (!settings.enabled) return;

    const found = findBadWord(body, getAllWords(settings));
    if (!found) return;

    let threadInfo;
    try { threadInfo = await api.getThreadInfo(threadID); } catch { return; }
    const adminIDs = (threadInfo.adminIDs || []).map(a => String(a.id));
    const botID = String(api.getCurrentUserID());
    const isBotAdmin = adminIDs.includes(botID);
    const isSenderAdmin = adminIDs.includes(String(senderID));

    // Never warn/kick group admins, just skip to avoid failed kick spam
    if (isSenderAdmin) return;

    const count = (settings.warnings[senderID] || 0) + 1;
    settings.warnings[senderID] = count;
    await saveSettings(threadsData, threadID, settings);

    const censored = hideWord(found);

    if (count === 1) {
      return api.sendMessage(getLang("warned", censored), threadID, messageID);
    }

    // 2nd offense = kick
    if (!isBotAdmin) {
      return api.sendMessage(getLang("needAdmin"), threadID, messageID);
    }

    try {
      await api.sendMessage(getLang("warned2", censored), threadID, messageID);
      await api.removeUserFromGroup(senderID, threadID);
      delete settings.warnings[senderID];
      await saveSettings(threadsData, threadID, settings);
    } catch {
      return api.sendMessage(getLang("needAdmin"), threadID, messageID);
    }
  }
};
