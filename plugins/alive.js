const os = require('os');
const process = require('process');
const settings = require('../settings');

module.exports = {
  command: 'alive',
  aliases: ['status'],
  category: 'info',
  description: 'Check bot status',
  usage: '.alive',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const uptime = process.uptime();
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const cpu = os.loadavg()[0].toFixed(2);
    const text = `🤖 *${settings.botName} is alive!*\n\n` +
      `⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
      `💾 RAM: ${ram} MB\n` +
      `🖥️ CPU: ${cpu}\n\n` +
      `🔗 Channel: ${settings.channelLink}\n` +
      `👑 Owner: ${settings.botOwner} & Muzamil Khan`;
    await sock.sendMessage(chatId, { text }, { quoted: message });
  }
};
