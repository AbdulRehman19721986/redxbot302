const settings = require('../settings');

module.exports = {
  command: 'channel',
  aliases: ['joinchannel'],
  category: 'info',
  description: 'Get bot channel link and JID',
  usage: '.channel',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = `📢 *Join our channel:*\n${settings.channelLink}\n\nJID: \`${settings.channelJid}\``;
    await sock.sendMessage(chatId, { text }, { quoted: message });
  }
};
