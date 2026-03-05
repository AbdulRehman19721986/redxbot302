// plugins/drama.js
const axios = require('axios');
const settings = require('../settings');

module.exports = {
  command: 'drama',
  aliases: ['dramadl', 'watchdrama'],
  category: 'download',
  description: 'Search and download dramas/videos',
  usage: '.drama <name> [result number]',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    if (args.length === 0) {
      return await sock.sendMessage(chatId, {
        text: `🎬 *Drama Downloader*\n\nUsage:\n.drama <drama name> [result number]\n\nExample: .drama sher ep1\nExample with number: .drama sher ep1 2`,
        ...channelInfo
      }, { quoted: message });
    }

    let index = 1;
    let query = args.join(' ');
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && args.length > 1) {
      index = parseInt(lastArg);
      query = args.slice(0, -1).join(' ');
    }

    await sock.sendPresenceUpdate('composing', chatId);
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for "${query}"...`,
      ...channelInfo
    }, { quoted: message });

    try {
      // Step 1: Search using the API
      const searchUrl = `https://jawad-tech.vercel.app/search/youtube?q=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 15000 });

      // Check API response status
      if (!searchRes.data?.status || !searchRes.data?.result) {
        throw new Error('Invalid API response');
      }

      const results = searchRes.data.result;
      if (results.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No results found. Try a different search term.',
          ...channelInfo
        }, { quoted: message });
      }

      // Validate index
      if (index < 1 || index > results.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Invalid number. Use 1-${results.length}`,
          ...channelInfo
        }, { quoted: message });
      }

      const selected = results[index - 1];
      const videoUrl = selected.link; // Direct YouTube link from API
      const title = selected.title;
      const channel = selected.channel;
      const duration = selected.duration;
      const thumbnail = selected.imageUrl;

      // Show selected item info
      await sock.sendMessage(chatId, {
        text: `✅ *Selected:*\n\n📌 *${title}*\n📺 ${channel}\n⏱️ ${duration}\n\n⏳ Fetching download...`,
        ...channelInfo
      }, { quoted: message });

      // Step 2: Get download link
      const downloadApiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
      const dlRes = await axios.get(downloadApiUrl, { timeout: 60000 });

      // Parse download response (common fields)
      let videoDlUrl = dlRes.data?.downloadUrl || dlRes.data?.url || dlRes.data?.link || dlRes.data?.video;
      if (!videoDlUrl && typeof dlRes.data === 'string' && dlRes.data.startsWith('http')) {
        videoDlUrl = dlRes.data;
      }

      if (!videoDlUrl) {
        throw new Error('Could not extract download URL');
      }

      // Step 3: Send video
      const caption = `🎬 *${title}*\n📺 ${channel}\n⏱️ ${duration}\n\n📥 Downloaded via ${settings.botName}`;
      
      const messageOptions = {
        video: { url: videoDlUrl },
        mimetype: 'video/mp4',
        caption: caption,
        contextInfo: {
          externalAdReply: {
            title: title.slice(0, 30),
            body: channel,
            thumbnailUrl: thumbnail,
            mediaType: 2,
            mediaUrl: videoDlUrl,
            sourceUrl: videoUrl
          }
        },
        ...channelInfo
      };

      await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (error) {
      console.error('❌ Drama command error:', error);
      let errorMsg = '❌ Failed to fetch drama.\n';
      if (error.response) {
        errorMsg += `API returned ${error.response.status}`;
      } else if (error.request) {
        errorMsg += 'No response from server.';
      } else {
        errorMsg += error.message;
      }
      await sock.sendMessage(chatId, {
        text: errorMsg,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
