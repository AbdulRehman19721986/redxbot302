module.exports = {
  command: 'setname',
  aliases: ['setpushname'],
  category: 'owner',
  description: 'Change bot display name (pushname)',
  usage: '.setname <new name>',
  ownerOnly: true,

  async handler(sock, message, args, context) {
    const { chatId, senderIsOwnerOrSudo } = context;
    const newName = args.join(' ').trim();

    if (!senderIsOwnerOrSudo) {
      return await sock.sendMessage(chatId, {
        text: '❌ Only owner/sudo can use this command.'
      }, { quoted: message });
    }

    if (!newName) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a new name.\nExample: .setname REDXBOT'
      }, { quoted: message });
    }

    try {
      // Update pushname using Baileys method
      await sock.updateProfileName(newName);
      await sock.sendMessage(chatId, {
        text: `✅ Bot name changed to: *${newName}*`
      }, { quoted: message });
    } catch (error) {
      console.error('SetName error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed to update name: ${error.message}`
      }, { quoted: message });
    }
  }
};
