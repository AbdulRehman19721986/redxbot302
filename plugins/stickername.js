// plugins/stickername.js
const store = require('../lib/lightweight_store');

module.exports = {
  command: 'stickername',
  aliases: ['setpack'],
  category: 'owner',
  description: 'Change default sticker pack name',
  usage: '.stickername <new pack name>',
  
  async handler(sock, message, args, context) {
    if (!message.key.fromMe) return;

    const { chatId } = context;
    const newName = args.join(' ').trim();

    if (!newName) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a new sticker pack name.\nExample: .stickername REDXBOT Pack'
      }, { quoted: message });
    }

    try {
      // Save in database
      await store.saveSetting('global', 'stickerPackName', newName);
      await sock.sendMessage(chatId, {
        text: `✅ Sticker pack name changed to: *${newName}*`
      }, { quoted: message });
    } catch (error) {
      console.error('StickerName error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed: ${error.message}`
      }, { quoted: message });
    }
  }
};
