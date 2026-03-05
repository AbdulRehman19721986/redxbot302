// plugins/botdp.js
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'botdp',
  aliases: ['setdp'],
  category: 'owner',
  description: 'Change bot profile picture (reply to image or URL)',
  usage: '.botdp <reply to image> or .botdp <image URL>',
  
  async handler(sock, message, args, context) {
    // Only allow the bot's own messages
    if (!message.key.fromMe) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ This command can only be used by the bot itself.'
      }, { quoted: message });
    }

    const { chatId } = context;
    let imageBuffer;

    // Check if replying to an image
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
      try {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        imageBuffer = Buffer.concat(chunks);
      } catch (e) {
        return await sock.sendMessage(chatId, {
          text: `❌ Failed to download image: ${e.message}`
        }, { quoted: message });
      }
    }
    // Check if URL provided
    else if (args[0] && (args[0].startsWith('http://') || args[0].startsWith('https://'))) {
      try {
        const response = await axios.get(args[0], { 
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        imageBuffer = Buffer.from(response.data);
      } catch (e) {
        return await sock.sendMessage(chatId, {
          text: `❌ Failed to fetch image from URL: ${e.message}`
        }, { quoted: message });
      }
    }
    else {
      return await sock.sendMessage(chatId, {
        text: '❌ Please reply to an image or provide an image URL.'
      }, { quoted: message });
    }

    try {
      // Update bot's own profile picture
      await sock.updateProfilePicture(sock.user.id, imageBuffer);
      await sock.sendMessage(chatId, {
        text: '✅ Bot profile picture updated successfully!'
      }, { quoted: message });
    } catch (error) {
      console.error('BotDP error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed to update profile picture:\n${error.message}`
      }, { quoted: message });
    }
  }
};
