const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: "clear",
  config: { name: "clear" },
  async execute({ api, event, config, reply }) {
    const sendReply = reply || ((text) => api.sendMessage(text, event.threadID, event.messageID));

    if (config.adminBot && !config.adminBot.includes(event.senderID)) {
      return sendReply("❌ Only admin can clear");
    }

    const cacheDir = path.join(__dirname, '../../cache');
    
    try {
      await fs.ensureDir(cacheDir);
      const files = await fs.readdir(cacheDir);
      
      if (files.length === 0 || (files.length === 1 && files[0] === 'cookies.txt')) {
        return sendReply("✅ Cache is already empty");
      }

      let deleted = 0;
      let size = 0;

      for (const file of files) {
        if (file === 'cookies.txt') continue;
        const filePath = path.join(cacheDir, file);
        try {
          const stat = await fs.stat(filePath);
          size += stat.size;
          await fs.remove(filePath);
          deleted++;
        } catch {}
      }

      const sizeMB = (size / 1024 / 1024).toFixed(2);
      return sendReply(`✅ Cleared ${deleted} files (${sizeMB} MB)`);

    } catch (e) {
      return sendReply(`❌ ${e.message}`);
    }
  }
  }
