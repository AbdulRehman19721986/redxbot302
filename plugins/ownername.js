// plugins/botname.js
module.exports = {
  command: 'botname',
  aliases: ['setbotname'],
  category: 'owner',
  description: 'Change bot display name (pushname)',
  usage: '.botname <new name>',
  
  async handler(sock, message, args, context) {
    if (!message.key.fromMe) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ This command can only be used by the bot itself.'
      }, { quoted: message });
    }

    const { chatId } = context;
    const newName = args.join(' ').trim();

    if (!newName) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a new name.\nExample: .botname REDXBOT'
      }, { quoted: message });
    }

    try {
      // Attempt to update profile name
      await sock.updateProfileName(newName);
      await sock.sendMessage(chatId, {
        text: `✅ Bot name changed to: *${newName}*`
      }, { quoted: message });
    } catch (error) {
      console.error('BotName error:', error);
      
      // Specific error message for "app state key not present"
      if (error.message.includes('app state key not present')) {
        await sock.sendMessage(chatId, {
          text: `❌ Failed to update name. This is a known Baileys bug. Try restarting the bot and use the command again. If it persists, your session may need to be re-paired.`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `❌ Failed to update name: ${error.message}`
        }, { quoted: message });
      }
    }
  }
};
