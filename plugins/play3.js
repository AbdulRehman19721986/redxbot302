const axios = require('axios');

module.exports = {
  command: 'play3',
  aliases: ['music3', 'song3'],
  category: 'music',
  description: 'Download a song as MP3 (Dhamz API)',
  usage: '.play3 <song name>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: "❌ *Missing song name*\nExample: .play3 Believer",
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: "🔍 *Searching via Dhamz API...*",
      ...channelInfo
    }, { quoted: message });

    try {
      // Search using Dhamz API
      const searchUrl = `https://api.dhamzxploit.my.id/api/spotify?search=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 15000 });

      if (!searchRes.data?.result?.length) {
        throw new Error('No results');
      }

      const track = searchRes.data.result[0];
      const title = track.title;
      const artist = track.artist;
      const duration = track.duration;
      const thumbnail = track.thumbnail;
      const audioUrl = track.download;

      await sock.sendMessage(chatId, {
        text: `✅ *Found:* ${title} - ${artist}\n⏱️ *Duration:* ${duration}\n⏳ *Downloading...*`,
        ...channelInfo
      }, { quoted: message });

      if (!audioUrl) {
        throw new Error('No download link');
      }

      // Get thumbnail
      let thumbBuffer = null;
      if (thumbnail) {
        try {
          const imgRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          thumbBuffer = Buffer.from(imgRes.data);
        } catch (e) {}
      }

      // Send audio
      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title} - ${artist}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: artist,
            thumbnail: thumbBuffer,
            mediaType: 2,
            mediaUrl: audioUrl,
            sourceUrl: audioUrl
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error('Play3 (Dhamz) error:', error.message);
      await sock.sendMessage(chatId, {
        text: "❌ *Download failed*\nPlease try .play or .play2 for alternative sources.",
        ...channelInfo
      }, { quoted: message });
    }
  }
};
