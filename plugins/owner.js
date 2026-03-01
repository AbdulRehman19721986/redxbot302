const settings = require('../settings');

module.exports = {
  command: 'owner',
  aliases: ['ownerinfo', 'contact'],
  category: 'info',
  description: 'Show bot owner contact',
  usage: '.owner',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + settings.botOwner + '\nTEL;waid=' + settings.ownerNumber + ':+' + settings.ownerNumber + '\nEND:VCARD';
    await sock.sendMessage(chatId, {
      contacts: {
        displayName: settings.botOwner,
        contacts: [{ vcard }]
      }
    }, { quoted: message });
  }
};
