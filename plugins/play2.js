const yts = require('yt-search');
const axios = require('axios');
const ytdl = require('ytdl-core');
const settings = require('../settings');

// Rate limiter to avoid API abuse
const rateLimiter = {
  queue: [],
  processing: false,
  lastRequest: 0,
  minDelay: 1000,

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  },

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();
    const now = Date.now();
    const timeSinceLast = now - this.lastRequest;
    if (timeSinceLast < this.minDelay) {
      await new Promise(r => setTimeout(r, this.minDelay - timeSinceLast));
    }
    this.lastRequest = Date.now();
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    }
    this.processing = false;
    this.process();
  }
};

async function fetchWithRetry(url, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 30000 });
      if (response.status === 429) {
        const retryAfter = response.headers['retry-after'] ? parseInt(response.headers['retry-after']) * 1000 : baseDelay * attempt;
        if (attempt < maxRetries) {
          console.log(`Rate limited. Retrying in ${retryAfter}ms...`);
          await new Promise(r => setTimeout(r, retryAfter));
          continue;
        }
        throw new Error('Rate limit exceeded');
      }
      if (response.status >= 400) throw new Error(`API error: ${response.status}`);
      return response.data;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 10+ reliable API endpoints
const API_LIST = [
  'https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=',
  'https://api.ryzendesu.vip/api/downloader/ytmp3?url=',
  'https://api.diioffc.web.id/api/download/ytmp3?url=',
  'https://api.siputzx.my.id/api/d/ytmp3?url=',
  'https://api.zenkey.my.id/api/download/ytmp3?url=',
  'https://api.neoxr.my.id/api/ytmp3?url=',
  'https://api.betabotz.eu.org/api/download/ytmp3?url=',
  'https://api.vreden.web.id/api/ytmp3?url=',
  'https://api.alandikasaputra.my.id/api/downloader/yt?url=',
  'https://api.firda.tech/api/ytmp3?url=',
  'https://api.agatz.xyz/api/ytmp3?url='
];

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

module.exports = {
  command: 'play',
  aliases: ['song', 'mp3'],
  category: 'music',
  description: 'Download a song from YouTube (MP3) with multiple API fallbacks',
  usage: '.play <song name or YouTube link>',

  async handler(sock, message, args, context = {}) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🎵 *Song Downloader*\n\nUsage:\n.play <song name | YouTube link>',
        ...channelInfo
      }, { quoted: message });
    }

    try {
      // Resolve query to a video URL
      let videoUrl, videoInfo;
      if (ytdl.validateURL(query)) {
        videoUrl = query;
        try {
          videoInfo = await ytdl.getInfo(videoUrl);
        } catch (e) {
          // ignore, we'll still have URL
        }
      } else {
        const search = await yts(query);
        if (!search?.videos?.length) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found. Try a different search term.',
            ...channelInfo
          }, { quoted: message });
        }
        videoUrl = search.videos[0].url;
        try {
          videoInfo = await ytdl.getInfo(videoUrl);
        } catch (e) {}
      }

      const title = videoInfo?.videoDetails?.title || 'Unknown Title';
      const thumbnail = videoInfo?.videoDetails?.thumbnails?.slice(-1)[0]?.url;

      // Send thumbnail if available
      if (thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: thumbnail },
          caption: `🎶 *${title}*`,
          ...channelInfo
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `⏳ Downloading *${title}*...`,
          ...channelInfo
        }, { quoted: message });
      }

      // Try each API in order
      let audioUrl = null;
      for (const apiBase of API_LIST) {
        try {
          const apiUrl = apiBase + encodeURIComponent(videoUrl);
          const data = await rateLimiter.add(() => fetchWithRetry(apiUrl));
          // Extract download URL (different APIs return different structures)
          const possibleFields = ['downloadUrl', 'url', 'audio', 'result', 'data'];
          for (const field of possibleFields) {
            if (data?.[field]) {
              audioUrl = data[field];
              break;
            }
            if (data?.result?.[field]) {
              audioUrl = data.result[field];
              break;
            }
          }
          if (audioUrl) break;
        } catch (err) {
          console.log(`API ${apiBase} failed:`, err.message);
        }
      }

      // If all APIs failed, fallback to ytdl direct download (requires ffmpeg)
      if (!audioUrl) {
        console.log('All APIs failed, falling back to ytdl-core');
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

      // Send audio from URL
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
