const axios = require('axios');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// Multiple API endpoints for fallback
const API_LIST = [
  'https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=',
  'https://api.ryzendesu.vip/api/downloader/ytmp3?url=',
  'https://api.diioffc.web.id/api/download/ytmp3?url='
];

// Simple in-memory cache to avoid repeated downloads of same song
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

module.exports = {
  command: 'play',
  aliases: ['song', 'mp3', 'ytmp3'],
  category: 'download',
  description: 'Download audio from YouTube by name or link',
  usage: '.play <song name or YouTube URL>',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🎵 *Song Downloader*\n\nUsage:\n.play <song name | YouTube link>',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);

    try {
      // Resolve query to a video URL
      let videoUrl;
      if (ytdl.validateURL(query)) {
        videoUrl = query;
      } else {
        const search = await ytSearch(query);
        if (!search.videos || search.videos.length === 0) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found. Try a different search term.',
            ...channelInfo
          }, { quoted: message });
        }
        videoUrl = search.videos[0].url;
      }

      // Check cache
      const cacheKey = videoUrl;
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          await sock.sendMessage(chatId, {
            audio: { url: cached.audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'song.mp3',
            ...channelInfo
          }, { quoted: message });
          return;
        }
      }

      // Get video info for thumbnail and title
      let videoInfo;
      try {
        videoInfo = await ytdl.getInfo(videoUrl);
      } catch (e) {
        // If ytdl fails, try to get info via a fallback API
        videoInfo = null;
      }

      const title = videoInfo?.videoDetails?.title || 'Unknown Title';
      const thumbnail = videoInfo?.videoDetails?.thumbnails?.slice(-1)[0]?.url;

      // Try each API in order
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
        // Last resort: try ytdl-core with ffmpeg (requires ffmpeg installed)
        try {
          const audioStream = ytdl(videoUrl, { quality: 'lowestaudio', filter: 'audioonly' });
          const chunks = [];
          for await (const chunk of audioStream) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);
          // Send directly
          if (thumbnail) {
            await sock.sendMessage(chatId, {
              image: { url: thumbnail },
              caption: `🎶 *${title}*`,
              ...channelInfo
            }, { quoted: message });
          }
          await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
            ...channelInfo
          }, { quoted: message });
          return;
        } catch (ytdlErr) {
          throw new Error('All download methods failed');
        }
      }

      // Cache the result
      cache.set(cacheKey, { audioUrl, timestamp: Date.now() });

      // Send thumbnail if available
      if (thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: thumbnail },
          caption: `🎶 *${title}*`,
          ...channelInfo
        }, { quoted: message });
      }

      // Send audio
      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: 'song.mp3',
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('Play command error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to download. Please try again later or use a different song.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
