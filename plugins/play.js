const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');
const settings = require('../settings');

// Try to use ffmpeg-static
let ffmpegPath = 'ffmpeg';
try {
  ffmpegPath = require('ffmpeg-static') || 'ffmpeg';
} catch (e) {
  // use system ffmpeg
}

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
      // Determine if query is a direct YouTube link
      let videoId = null;
      if (ytdl.validateURL(query)) {
        videoId = ytdl.getVideoID(query);
      }

      let videoInfo;
      if (videoId) {
        videoInfo = await ytdl.getInfo(videoId);
      } else {
        const searchResult = await ytSearch(query);
        if (!searchResult.videos || searchResult.videos.length === 0) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found. Try a different search term.',
            ...channelInfo
          }, { quoted: message });
        }
        videoInfo = await ytdl.getInfo(searchResult.videos[0].url);
      }

      const { videoDetails } = videoInfo;
      const title = videoDetails.title;
      const duration = parseInt(videoDetails.lengthSeconds);
      const thumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url;

      if (duration > 600) { // 10 min limit
        return await sock.sendMessage(chatId, {
          text: `❌ Video too long (${Math.floor(duration / 60)} min). Max allowed: 10 min.`,
          ...channelInfo
        }, { quoted: message });
      }

      // Send info with thumbnail
      await sock.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎶 *${title}*\n⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        ...channelInfo
      }, { quoted: message });

      await sock.sendMessage(chatId, {
        text: '⏳ Downloading audio... Please wait.',
        ...channelInfo
      }, { quoted: message });

      // Create temp directory
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const outputPath = path.join(tempDir, `${Date.now()}.mp3`);

      // Download and convert
      const audioStream = ytdl(videoDetails.video_url, {
        quality: 'lowestaudio',
        filter: 'audioonly'
      });

      const ffmpegProcess = exec(`"${ffmpegPath}" -i pipe:0 -vn -ab 128k -f mp3 -y "${outputPath}"`, {
        maxBuffer: 1024 * 1024 * 10
      });

      audioStream.pipe(ffmpegProcess.stdin);

      await new Promise((resolve, reject) => {
        ffmpegProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpegProcess.on('error', reject);
      });

      const audioBuffer = fs.readFileSync(outputPath);

      // Send audio with optional thumbnail in context
      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
        ptt: false,
        contextInfo: thumbnail ? {
          externalAdReply: {
            title: title.slice(0, 30),
            body: `Downloaded by ${settings.botName}`,
            thumbnailUrl: thumbnail,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        } : undefined
      }, { quoted: message });

      fs.unlinkSync(outputPath);

    } catch (error) {
      console.error('Play command error:', error);
      // Fallback to external API if ytdl fails
      try {
        await sock.sendMessage(chatId, {
          text: '⚠️ Direct download failed, trying alternative source...',
          ...channelInfo
        }, { quoted: message });

        // Use external API as fallback (same as play2 but we'll call it internally)
        const apiUrl = `https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=${encodeURIComponent(query)}`;
        const apiRes = await axios.get(apiUrl, { timeout: 30000 });
        if (apiRes.data?.downloadUrl) {
          const audioUrl = apiRes.data.downloadUrl;
          await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'song.mp3',
            ...channelInfo
          }, { quoted: message });
          return;
        }
        throw new Error('API fallback failed');
      } catch (fallbackErr) {
        await sock.sendMessage(chatId, {
          text: '❌ Failed to download. Please try again later or use a different song.',
          ...channelInfo
        }, { quoted: message });
      }
    }
  }
};
