const axios = require('axios');
const ytSearch = require('yt-search');
const settings = require('../settings');

const API_LIST = [
  'https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=',
  'https://api.ryzendesu.vip/api/downloader/ytmp3?url=',
  'https://api.diioffc.web.id/api/download/ytmp3?url='
];

module.exports = {
  command: 'play2',
  aliases: ['song2', 'ytmp32'],
  category: 'download',
  description: 'Alternative download method (multiple sources)',
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
      // Search for video
      const search = await ytSearch(query);
      if (!search.videos || search.videos.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No results found.',
          ...channelInfo
        }, { quoted: message });
      }
      const video = search.videos[0];
      const videoUrl = video.url;
      const title = video.title;
      const thumbnail = video.thumbnail;

      // Try each API
      let audioUrl = null;
      for (const apiBase of API_LIST) {
        try {
          const apiUrl = apiBase + encodeURIComponent(videoUrl);
          const res = await axios.get(apiUrl, { timeout: 15000 });
          if (res.data?.downloadUrl || res.data?.url || res.data?.audio) {
            audioUrl = res.data.downloadUrl || res.data.url || res.data.audio;
            break;
          }
        } catch (e) {
          console.log(`API ${apiBase} failed:`, e.message);
        }
      }

      if (!audioUrl) {
        throw new Error('All APIs failed');
      }

      // Send thumbnail and audio
      await sock.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎶 *${title}*`,
        ...channelInfo
      }, { quoted: message });

      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: 'song.mp3',
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Play2 error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ All download sources failed. Try .play instead.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
