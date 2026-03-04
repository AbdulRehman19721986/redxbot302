const axios = require('axios');
const settings = require('../settings');

module.exports = {
  command: 'play2',
  aliases: ['song2', 'ytmp32'],
  category: 'download',
  description: 'Alternative download method (external API)',
  usage: '.play2 <song name>',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🎵 *Alternative Song Downloader*\n\nUsage:\n.play2 <song name>',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);

    try {
      // Using a free API (example: https://api.example.com/search?q=...)
      // Replace with your preferred API endpoint
      const searchApi = `https://some-music-api.com/search?q=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchApi);
      if (!searchRes.data || !searchRes.data.length) {
        return await sock.sendMessage(chatId, {
          text: '❌ No results found.',
          ...channelInfo
        }, { quoted: message });
      }

      const first = searchRes.data[0];
      const title = first.title;
      const duration = first.duration;
      const thumbnail = first.thumbnail;
      const downloadUrl = first.downloadUrl; // assume API provides direct MP3

      await sock.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎶 *${title}*\n⏱️ Duration: ${duration}`,
        ...channelInfo
      }, { quoted: message });

      await sock.sendMessage(chatId, {
        text: '⏳ Downloading from external source...',
        ...channelInfo
      }, { quoted: message });

      // Download file
      const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioRes.data);

      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
        ptt: false,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Play2 error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Alternative download failed. Try .play instead.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
