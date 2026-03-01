const axios = require('axios');

module.exports = {
  command: 'tgstalk',
  aliases: ['tguser', 'tginfo'],
  category: 'stalk',
  description: 'Lookup Telegram channel or user',
  usage: '.tgstalk <username>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(chatId, {
        text: '*Please provide a Telegram username.*\nExample: .tginfo TeamRedxhacker2'
      }, { quoted: message });
    }

    const username = args[0];

    try {
      const apiUrl = `https://discardapi.onrender.com/api/stalk/telegram?apikey=guru&url=${username}`;
      const { data } = await axios.get(apiUrl, { 
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!data?.result) {
        return await sock.sendMessage(chatId, { text: '❌ Telegram user/channel not found.' }, { quoted: message });
      }

      const result = data.result;
      const profileImage = result.image_url || null;

      const caption = `📱 *Telegram Info*\n\n` +
                      `👤 Title: ${result.title || 'N/A'}\n` +
                      `📝 Description: ${result.description || 'N/A'}\n` +
                      `🔗 Link: ${result.url || `https://t.me/${username}`}`;

      if (profileImage) {
        await sock.sendMessage(chatId, { image: { url: profileImage }, caption: caption }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: caption }, { quoted: message });
      }

    } catch (err) {
      console.error('Telegram plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch Telegram info.' }, { quoted: message });
    }
  }
};
