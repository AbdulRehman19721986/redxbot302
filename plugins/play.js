const yts = require('yt-search');
const axios = require('axios');

// Rate limiter to avoid API abuse
const rateLimiter = {
  queue: [],
  processing: false,
  lastRequest: 0,
  minDelay: 1000, // 1 second between requests

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
    } finally {
      this.processing = false;
      this.process();
    }
  }
};

// Retry logic for API calls
async function fetchWithRetry(url, maxRetries = 3, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 30000 });
      if (response.status === 429) { // rate limit
        const retryAfter = response.headers['retry-after']
          ? parseInt(response.headers['retry-after']) * 1000
          : baseDelay * attempt;
        if (attempt < maxRetries) {
          console.log(`Rate limited. Retrying in ${retryAfter}ms...`);
          await new Promise(r => setTimeout(r, retryAfter));
          continue;
        }
        throw new Error('Rate limit exceeded');
      }
      if (response.status >= 400) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.data;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Extract video ID from YouTube URL
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
  description: 'Download a song from YouTube (MP3) – uses qasimdev API',
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
      let video, videoUrl;

      // Check if query is a YouTube link
      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        const videoId = extractVideoId(query);
        if (!videoId) throw new Error('Invalid YouTube link');
        const searchResult = await yts({ videoId });
        video = searchResult; // yts returns a video object when using videoId
        videoUrl = query;
      } else {
        // Search by keyword
        const searchResult = await yts(query);
        if (!searchResult?.videos?.length) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found. Please try a different search term.',
            ...channelInfo
          }, { quoted: message });
        }
        video = searchResult.videos[0];
        videoUrl = video.url;
      }

      // Send thumbnail and info
      if (video.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: video.thumbnail },
          caption: `🎶 *${video.title}*\n⏱️ Duration: ${video.timestamp || 'N/A'}`,
          ...channelInfo
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `⏳ Downloading *${video.title}*...`,
          ...channelInfo
        }, { quoted: message });
      }

      // Download using the qasimdev API
      const downloadUrl = `https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=${encodeURIComponent(videoUrl)}`;
      const downloadData = await rateLimiter.add(() => fetchWithRetry(downloadUrl));

      if (!downloadData?.downloadUrl) {
        throw new Error('Download URL not found in API response');
      }

      const audioUrl = downloadData.downloadUrl;

      // Try to send audio; if fails, try alternative URLs if provided
      let sent = false;
      const urlsToTry = [audioUrl, ...(downloadData.alternativeUrls || [])];
      for (const url of urlsToTry) {
        try {
          await sock.sendMessage(chatId, {
            audio: { url },
            mimetype: 'audio/mpeg',
            fileName: `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
            ...channelInfo
          }, { quoted: message });
          sent = true;
          break;
        } catch (e) {
          console.log(`Failed to send from ${url}:`, e.message);
          continue;
        }
      }

      if (!sent) throw new Error('All download URLs failed');

    } catch (error) {
      console.error('Play Command Error:', error);
      let errorMsg = '❌ Failed to download song.\n';
      if (error.message.includes('rate limit')) {
        errorMsg += 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMsg += 'Download timed out. Try a shorter video.';
      } else {
        errorMsg += 'Service is busy. Please try again in a minute.';
      }

      await sock.sendMessage(chatId, {
        text: errorMsg,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
