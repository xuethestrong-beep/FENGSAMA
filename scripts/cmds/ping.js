module.exports = {
  name: "ping",
  async execute({ api, event }) {
    const ram = (process.memoryUsage().heapUsed/1024/1024).toFixed(2);
    api.sendMessage(`FENG 🏓\nRAM: ${ram}MB / 400MB\nUptime: ${Math.floor(process.uptime()/60)}m`, event.threadID);
  }
}
