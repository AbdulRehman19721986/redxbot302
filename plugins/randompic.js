// plugins/randompic.js
const axios = require('axios');
const settings = require('../settings');

module.exports = {
  command: 'randompic',
  aliases: ['randombg', 'randimage'],
  category: 'fun',
  description: 'Get a random picture (from various categories)',
  usage: '.randompic [category] (default: ba)',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const category = args[0]?.toLowerCase() || 'ba';

    await sock.sendPresenceUpdate('composing', chatId);
    await sock.sendMessage(chatId, {
      text: `🔍 Fetching random ${category} image...`,
      ...channelInfo
    }, { quoted: message });

    try {
      const apiUrl = `https://jawad-tech.vercel.app/random/${encodeURIComponent(category)}`;
      const response = await axios.get(apiUrl, { timeout: 15000 });

      // Extract image URL from various possible response structures
      let imageUrl;
      if (response.data?.result) {
        imageUrl = response.data.result;
      } else if (typeof response.data === 'string' && response.data.startsWith('http')) {
        imageUrl = response.data;
      } else if (response.data?.url) {
        imageUrl = response.data.url;
      } else {
        throw new Error('Unexpected API response');
      }

      // Download the image
      const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const imageBuffer = Buffer.from(imgRes.data);

      await sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: `🖼️ Random ${category} image`,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Randompic error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to fetch random image. Try another category.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
