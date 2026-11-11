const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const checkCooldown = require("./utils/mediaCooldown");

const CACHE_DIR = path.join(__dirname, "cache");
const API_TIMEOUT = 60000;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

const http = axios.create({
  timeout: API_TIMEOUT,
  maxRedirects: 5,
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

// Safely remove temporary messages
async function safeUnsend(message, messageID) {
  if (!messageID) return;

  try {
    await message.unsend(messageID);
  } catch (err) {
    console.log("[MUSIC] Unable to remove message:", err.message);
  }
}

// Safely remove temporary audio files
function removeFile(file) {
  if (!file) return;

  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch (err) {
    console.error("[MUSIC] File cleanup error:", err.message);
  }
}

// Get API response data
function getResponseData(response) {
  const data = response?.data;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid response from music API.");
  }

  if (data.success === false || data.status === "error") {
    throw new Error(
      data.message || data.error || "Music API request failed."
    );
  }

  return data;
}

// Detect audio formats
function selectAudioFormat(formats) {
  if (!Array.isArray(formats)) return null;

  const audioFormats = formats.filter(format => {
    if (!format || !format.url) return false;

    const type = String(format.type || "").toLowerCase();
    const ext = String(format.ext || "").toLowerCase();
    const mime = String(format.mimeType || "").toLowerCase();

    return (
      type.includes("audio") ||
      ext === "mp3" ||
      ext === "m4a" ||
      ext === "aac" ||
      ext === "opus" ||
      ext === "ogg" ||
      mime.startsWith("audio/")
    );
  });

  // Prefer MP3 when available
  return (
    audioFormats.find(f =>
      String(f.ext || "").toLowerCase() === "mp3"
    ) ||
    audioFormats.find(f =>
      String(f.mimeType || "").toLowerCase().includes("mpeg")
    ) ||
    audioFormats[0] ||
    null
  );
}

// Validate download URL
function validateURL(value) {
  if (!value || typeof value !== "string") {
    throw new Error("The API did not provide a download URL.");
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("The API returned an invalid download URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Unsupported download URL protocol.");
  }

  return value;
}

// Get download URL from the API
async function getDownloadURL(stapi, videoURL) {
  const endpoint = `${stapi.baseURL}/st/ytviddl`;

  const firstResponse = await http.post(endpoint, {
    url: videoURL
  });

  const firstData = getResponseData(firstResponse);

  console.log("[MUSIC] Format response:", firstData);

  const formats = Array.isArray(firstData.formats)
    ? firstData.formats
    : [];

  const selected = selectAudioFormat(formats);

  // Some APIs return a download URL immediately
  const immediateURL =
    firstData.downloadUrl ||
    firstData.download_url ||
    firstData.url;

  if (immediateURL && formats.length === 0) {
    return validateURL(immediateURL);
  }

  if (!selected) {
    throw new Error(
      "No supported audio format found. Check the API response."
    );
  }

  const secondResponse = await http.post(endpoint, {
    url: videoURL,
    formatUrl: selected.url
  });

  const secondData = getResponseData(secondResponse);

  console.log("[MUSIC] Download response:", secondData);

  const downloadURL =
    secondData.downloadUrl ||
    secondData.download_url ||
    secondData.url;

  return validateURL(downloadURL);
}

// Download audio to a temporary file
async function downloadAudio(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const file = path.join(
    CACHE_DIR,
    `music_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.mp3`
  );

  try {
    const response = await http.get(url, {
      responseType: "arraybuffer",
      maxContentLength: MAX_AUDIO_SIZE,
      maxBodyLength: MAX_AUDIO_SIZE
    });

    const data = Buffer.from(response.data);

    if (!data.length) {
      throw new Error("The downloaded audio file is empty.");
    }

    if (data.length > MAX_AUDIO_SIZE) {
      throw new Error("Audio file exceeds the 25 MB size limit.");
    }

    // Avoid saving an HTML error page as an MP3 file
    const contentType = String(
      response.headers["content-type"] || ""
    ).toLowerCase();

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      throw new Error(
        "The download URL returned a webpage instead of audio."
      );
    }

    fs.writeFileSync(file, data);

    return file;
  } catch (err) {
    removeFile(file);
    throw err;
  }
}

// Download and send a selected song
async function processSong({
  message,
  video,
  stapi,
  requestedBy
}) {
  let file;
  let processingMessage;

  try {
    processingMessage = await message.reply(
      `⬇️ Processing: ${video.title}`
    );

    const downloadURL = await getDownloadURL(
      stapi,
      video.url
    );

    file = await downloadAudio(downloadURL);

    await safeUnsend(
      message,
      processingMessage?.messageID
    );

    processingMessage = null;

    const author =
      requestedBy ||
      video.author?.name ||
      "Unknown";

    await message.reply({
      body:
        `🎶 ${video.title}\n` +
        `👤 ${author}\n` +
        `⏱ ${video.timestamp || "Unknown duration"}`,
      attachment: fs.createReadStream(file)
    });
  } catch (err) {
    console.error("[MUSIC] Download error:", err);

    await safeUnsend(
      message,
      processingMessage?.messageID
    );

    const errorMessage =
      err.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : err.response?.status === 429
        ? "The music API is busy. Please try again later."
        : err.response?.status >= 500
        ? "The music API server is unavailable."
        : err.message || "An unexpected error occurred.";

    await message.reply(`❌ Music error: ${errorMessage}`);
  } finally {
    removeFile(file);
  }
}

module.exports = {
  config: {
    name: "music",
    aliases: [],
    version: "2.5.0",
    author: "ST | Sheikh Tamim",
    role: 0,
    category: "music"
  },

  ST: async function ({
    message,
    args,
    event,
    api
  }) {
    if (!args || args.length === 0) {
      return message.reply(
        "🎵 Enter a song name.\n\n" +
        "Usage: music song name\n" +
        "Search list: music -s song name"
      );
    }

    let showList = false;

    if (args[0] === "-s") {
      showList = true;
      args.shift();
    }

    const query = args.join(" ").trim();

    if (!query) {
      return message.reply("❌ Enter a song name.");
    }

    // Check cooldown
    try {
      const allowed = await checkCooldown(
        "music",
        event.senderID,
        api,
        event.threadID
      );

      if (!allowed) return;
    } catch (err) {
      console.error("[MUSIC] Cooldown error:", err);
      return message.reply(
        "❌ Unable to check cooldown. Please try again."
      );
    }

    let processing;

    try {
      processing = await message.reply(
        `🔍 Searching "${query}"...`
      );

      const search = await yts(query);
      const videos = search?.videos || [];

      if (videos.length === 0) {
        await safeUnsend(
          message,
          processing?.messageID
        );

        return message.reply("❌ No results found.");
      }

      // Automatic download of the first result
      if (!showList) {
        await safeUnsend(
          message,
          processing?.messageID
        );

        const stapi = new global.utils.STBotApis();

        return processSong({
          message,
          video: videos[0],
          stapi
        });
      }

      // Show up to six search results
      const top = videos.slice(0, 6);

      let output = `🔍 Results for "${query}"\n\n`;

      top.forEach((video, index) => {
        output +=
          `${index + 1}. ${video.title}\n` +
          `👤 ${video.author?.name || "Unknown"}\n` +
          `⏱ ${video.timestamp || "Unknown duration"}\n\n`;
      });

      output += "👉 Reply with a number from 1 to " +
        top.length;

      await safeUnsend(
        message,
        processing?.messageID
      );

      processing = null;

      const info = await message.reply(output);

      if (info?.messageID && global.GoatBot?.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          author: event.senderID,
          videos: top
        });
      }
    } catch (err) {
      console.error("[MUSIC] Search error:", err);

      await safeUnsend(
        message,
        processing?.messageID
      );

      return message.reply(
        "❌ Search failed. Please try again.\n" +
        `Details: ${err.message || "Unknown error"}`
      );
    }
  },

  onReply: async function ({
    message,
    event,
    Reply,
    usersData
  }) {
    // Only the original requester can select a song
    if (String(event.senderID) !== String(Reply.author)) {
      return message.reply("⚠️ This is not your music request.");
    }

    const choice = Number.parseInt(
      String(event.body || "").trim(),
      10
    );

    if (
      !Number.isInteger(choice) ||
      choice < 1 ||
      choice > Reply.videos.length
    ) {
      return message.reply(
        `❌ Invalid choice. Reply with a number from 1 to ${Reply.videos.length}.`
      );
    }

    try {
      const stapi = new global.utils.STBotApis();

      let userName = "Unknown";

      if (usersData?.getName) {
        try {
          userName = await usersData.getName(event.senderID);
        } catch (err) {
          console.error(
            "[MUSIC] Unable to get requester name:",
            err.message
          );
        }
      }

      const video = Reply.videos[choice - 1];

      return processSong({
        message,
        video,
        stapi,
        requestedBy: userName
      });
    } catch (err) {
      console.error("[MUSIC] Reply handler error:", err);

      return message.reply(
        "❌ Unable to process your music request. Please try again."
      );
    }
  }
};
```
  
