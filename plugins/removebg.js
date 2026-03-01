const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function getImageBuffer(message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  let imageMessage = quoted?.imageMessage || message.message?.imageMessage;
  if (!imageMessage) return null;

  const stream = await downloadContentFromMessage(imageMessage, 'image');
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = {
  command: 'removebg',
  aliases: ['rmbg', 'bgremove'],
  category: 'tools',
  description: 'Remove background from an image',
  usage: '.removebg (reply to image or send image with caption)',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const imageBuffer = await getImageBuffer(message);

      if (!imageBuffer) {
        return await sock.sendMessage(chatId, {
          text:
            '📸 *Remove Background*\n\nUsage:\n' +
            '• Reply to an image with `.removebg`\n' +
            '• Send image with caption `.removebg`'
        }, { quoted: message });
      }

      const apiKey = process.env.REMOVEBG_KEY;
      if (!apiKey) {
        return await sock.sendMessage(chatId, {
          text: '❌ RemoveBG API key not configured.'
        }, { quoted: message });
      }

      const form = new FormData();
      form.append('size', 'auto');
      form.append('image_file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
        headers: { ...form.getHeaders(), 'X-Api-Key': apiKey },
        responseType: 'arraybuffer',
        timeout: 60000
      });

      await sock.sendMessage(chatId, {
        image: response.data,
        caption: '✨ *Background removed successfully*\n\n𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔-𝗠𝗗'
      }, { quoted: message });

    } catch (err) {
      console.error('RemoveBG Error:', err?.response?.data || err.message);

      let msg = '❌ Failed to remove background.';
      if (err.response?.status === 402) msg = '💳 API quota exceeded.';
      else if (err.response?.status === 401) msg = '🔑 Invalid API key.';
      else if (err.code === 'ECONNABORTED') msg = '⏰ Request timeout. Try again.';

      await sock.sendMessage(chatId, { text: msg }, { quoted: message });
    }
  }
};
