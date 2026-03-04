const os = require('os');
module.exports = [{
  pattern: "sysinfo",
  alias: ["system", "stats"],
  desc: "Show system information",
  category: "utility",
  react: "💻",
  filename: __filename,
  use: ".sysinfo",
  execute: async (conn, mek, m, { from, reply }) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (24 * 3600));
    const hours = Math.floor((uptime % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const memory = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const info = `
💻 *System Information*
⏱️ *Uptime:* ${uptimeStr}
🖥️ *Platform:* ${os.platform()} (${os.arch()})
🧠 *CPU:* ${os.cpus()[0].model}
📊 *Memory Usage:*
  RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
  Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB
  Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
  External: ${(memory.external / 1024 / 1024).toFixed(2)} MB
💾 *Total RAM:* ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
💾 *Free RAM:* ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB
📦 *Node.js:* ${process.version}
⚡ *Commands Loaded:* ${global.commands ? global.commands.size : 'N/A'}
    `;

    await reply(info);
  }
}];
