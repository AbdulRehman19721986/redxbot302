// plugins/ownername.js
const store = require('../lib/lightweight_store');

module.exports = {
  command: 'ownername',
  aliases: ['setowner'],
  category: 'owner',
  description: 'Change owner name (for menu display)',
  usage: '.ownername <new owner name>',
  
  async handler(sock, message, args, context) {
    if (!message.key.fromMe) return;

    const { chatId } = context;
    const newName = args.join(' ').trim();

    if (!newName) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a new owner name.\nExample: .ownername Abdul Rehman'
      }, { quoted: message });
    }

    try {
      // Save in database
      await store.saveSetting('global', 'botOwner', newName);
      await sock.sendMessage(chatId, {
        text: `✅ Owner name changed to: *${newName}*`
      }, { quoted: message });
    } catch (error) {
      console.error('OwnerName error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed: ${error.message}`
      }, { quoted: message });
    }
  }
};
