const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner'); // adjust path as needed

module.exports = {
  command: 'botdp',
  aliases: ['setdp', 'setprofile'],
  category: 'owner',
  description: 'Change bot profile picture (reply to an image)',
  usage: '.botdp (reply to an image)',
  ownerOnly: true, // ensures only owner/sudo can use

  async handler(sock, message, args, context) {
    const { chatId, channelInfo, senderId, isOwnerOrSudoCheck } = context;

    // Security check (already enforced by ownerOnly flag, but double-check)
    if (!isOwnerOrSudoCheck) {
      return await sock.sendMessage(chatId, {
        text: '❌ Only the bot owner can change the profile picture.',
        ...channelInfo
      }, { quoted: message });
    }

    // Get the quoted message
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.imageMessage) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please reply to an image you want to set as bot profile picture.',
        ...channelInfo
      }, { quoted: message });
    }

    try {
      // Download the image
      const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Save temporarily (optional, for logging)
      const tempPath = path.join(__dirname, '../temp', `${crypto.randomBytes(6).toString('hex')}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      // Update profile picture using Baileys method
      await sock.updateProfilePicture(sock.user.id, buffer);

      // Clean up temp file
      fs.unlinkSync(tempPath);

      await sock.sendMessage(chatId, {
        text: '✅ Bot profile picture updated successfully!',
        ...channelInfo
      }, { quoted: message });
    } catch (error) {
      console.error('Error changing bot DP:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed to change profile picture: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
