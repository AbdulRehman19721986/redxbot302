const yts = require('yt-search');
const axios = require('axios');
const ytdl = require('ytdl-core');
const settings = require('../settings');

const API_LIST = [
  'https://api.siputzx.my.id/api/d/ytmp3?url=',
  'https://api.zenkey.my.id/api/download/ytmp3?url=',
  'https://api.neoxr.my.id/api/ytmp3?url=',
  'https://api.betabotz.eu.org/api/download/ytmp3?url=',
  'https://api.vreden.web.id/api/ytmp3?url=',
  'https://api.alandikasaputra.my.id/api/downloader/yt?url=',
  'https://api.firda.tech/api/ytmp3?url=',
  'https://api.agatz.xyz/api/ytmp3?url=',
  'https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=',
  'https://api.ryzendesu.vip/api/downloader/ytmp3?url=',
  'https://api.diioffc.web.id/api/download/ytmp3?url='
];

module.exports = {
  command: 'play3',
  aliases: ['song3', 'ytmp33'],
  category: 'music',
  description: 'Third song downloader with additional APIs',
  usage: '.play3 <song name>',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🎵 *Third Song Downloader*\n\nUsage:\n.play3 <song name>',
        ...channelInfo
      }, { quoted: message });
    }

    try {
      const search = await yts(query);
      if (!search.videos?.length) {
        return await sock.sendMessage(chatId, {
          text: '❌ No results found.',
          ...channelInfo
        }, { quoted: message });
      }
      const video = search.videos[0];
      const videoUrl = video.url;
      const title = video.title;
      const thumbnail = video.thumbnail;

      await sock.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎶 *${title}*`,
        ...channelInfo
      }, { quoted: message });

      let audioUrl = null;
      for (const apiBase of API_LIST) {
        try {
          const apiUrl = apiBase + encodeURIComponent(videoUrl);
          const res = await axios.get(apiUrl, { timeout: 15000 });
          const data = res.data;
          if (typeof data === 'string' && data.startsWith('http')) {
            audioUrl = data;
          } else if (data?.url) {
            audioUrl = data.url;
          } else if (data?.downloadUrl) {
            audioUrl = data.downloadUrl;
          } else if (data?.result?.url) {
            audioUrl = data.result.url;
          } else if (data?.data?.url) {
            audioUrl = data.data.url;
          } else if (data?.audio) {
            audioUrl = data.audio;
          }
          if (audioUrl) break;
        } catch (e) {
          console.log(`API ${apiBase} failed:`, e.message);
        }
      }

      if (!audioUrl) {
        // Fallback to ytdl
        const audioStream = ytdl(videoUrl, { quality: 'lowestaudio', filter: 'audioonly' });
        const chunks = [];
        for await (const chunk of audioStream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        await sock.sendMessage(chatId, {
          audio: buffer,
          mimetype: 'audio/mpeg',
          fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
          ...channelInfo
        }, { quoted: message });
        return;
      }

      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: 'song.mp3',
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Play3 error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ All download sources failed. Try .play instead.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
