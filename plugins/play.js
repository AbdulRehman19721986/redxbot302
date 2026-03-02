const axios = require('axios');

module.exports = {
  command: 'play',
  aliases: ['music', 'song'],
  category: 'music',
  description: 'Download a song as MP3 (Akuari API)',
  usage: '.play <song name>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: "❌ *Missing song name*\nExample: .play Believer",
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: "🔍 *Searching for your song...*",
      ...channelInfo
    }, { quoted: message });

    try {
      // Search using Akuari API
      const searchUrl = `https://api.akuari.my.id/apis/spotify?q=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 15000 });

      if (!searchRes.data?.result?.length) {
        throw new Error('No results');
      }

      const track = searchRes.data.result[0];
      const title = track.title;
      const artist = track.artist;
      const duration = track.duration;
      const thumbnail = track.thumbnail;
      const spotifyUrl = track.url;

      await sock.sendMessage(chatId, {
        text: `✅ *Found:* ${title} - ${artist}\n⏱️ *Duration:* ${duration}\n⏳ *Downloading...*`,
        ...channelInfo
      }, { quoted: message });

      // Download using Akuari download endpoint
      const downloadUrl = `https://api.akuari.my.id/apis/spotify/download?url=${encodeURIComponent(spotifyUrl)}`;
      const downloadRes = await axios.get(downloadUrl, { timeout: 30000 });

      if (!downloadRes.data?.result?.download) {
        throw new Error('Download link not found');
      }

      const audioUrl = downloadRes.data.result.download;

      // Get thumbnail buffer
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
            mediaUrl: spotifyUrl,
            sourceUrl: spotifyUrl
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error('Play (Akuari) error:', error.message);
      await sock.sendMessage(chatId, {
        text: "❌ *Download failed*\nPlease try .play2 or .play3 for alternative sources.",
        ...channelInfo
      }, { quoted: message });
    }
  }
};
