// plugins/description.js
module.exports = {
  command: 'description',
  aliases: ['setdesc', 'setabout'],
  category: 'owner',
  description: 'Change bot description (about/bio)',
  usage: '.description <new description>',
  
  async handler(sock, message, args, context) {
    if (!message.key.fromMe) return;

    const { chatId } = context;
    const newDesc = args.join(' ').trim();

    if (!newDesc) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a new description.\nExample: .description Powered by REDXBOT'
      }, { quoted: message });
    }

    try {
      await sock.updateProfileStatus(newDesc);
      await sock.sendMessage(chatId, {
        text: `✅ Bot description updated to:\n*${newDesc}*`
      }, { quoted: message });
    } catch (error) {
      console.error('Description error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed: ${error.message}`
      }, { quoted: message });
    }
  }
};
