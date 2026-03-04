const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const settings = require('../settings');

// Check for ffmpeg availability
let ffmpegPath = 'ffmpeg'; // assume in PATH
try {
  require('ffmpeg-static');
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  // use system ffmpeg
}

module.exports = {
  command: 'play',
  aliases: ['song', 'music', 'ytmp3'],
  category: 'download',
  description: 'Download and play audio from YouTube by song name',
  usage: '.play <song name>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ');
    
    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a song name!\nExample: .play Shape of You',
        ...channelInfo
      }, { quoted: message });
    }

    // Send typing indicator
    await sock.sendPresenceUpdate('composing', chatId);

    // Initial reply
    const statusMsg = await sock.sendMessage(chatId, {
      text: `🔍 Searching for "${query}"...`,
      ...channelInfo
    }, { quoted: message });

    try {
      // Search YouTube
      const searchResult = await ytSearch(query);
      const videos = searchResult.videos;
      
      if (!videos || videos.length === 0) {
        return await sock.sendMessage(chatId, {
          text: `❌ No results found for "${query}"`,
          ...channelInfo
        }, { quoted: message });
      }

      const firstVideo = videos[0];
      const videoUrl = firstVideo.url;
      const title = firstVideo.title;
      const duration = firstVideo.duration.seconds;

      // Duration limit (optional) – e.g., 10 minutes max
      if (duration > 600) {
        return await sock.sendMessage(chatId, {
          text: `❌ Video too long (${Math.floor(duration/60)} min). Maximum allowed is 10 minutes.`,
          ...channelInfo
        }, { quoted: message });
      }

      // Update status
      await sock.sendMessage(chatId, {
        text: `🎵 Found: *${title}*\n⏱️ Duration: ${firstVideo.duration.toString}\n📥 Downloading audio...`,
        ...channelInfo
      }, { quoted: message });

      // Create temp file
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      const outputPath = path.join(tempDir, `${Date.now()}.mp3`);

      // Download and convert using ytdl + ffmpeg
      const audioStream = ytdl(videoUrl, {
        quality: 'lowestaudio',
        filter: 'audioonly'
      });

      // Use ffmpeg to convert to mp3
      const ffmpegProcess = exec(`"${ffmpegPath}" -i pipe:0 -vn -ab 128k -f mp3 -y "${outputPath}"`, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      audioStream.pipe(ffmpegProcess.stdin);
      
      ffmpegProcess.stderr.on('data', (data) => {
        console.log('ffmpeg:', data.toString());
      });

      await new Promise((resolve, reject) => {
        ffmpegProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpegProcess.on('error', reject);
      });

      // Read file
      const audioBuffer = fs.readFileSync(outputPath);

      // Send audio
      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        ptt: false, // set to true for voice note
        contextInfo: {
          externalAdReply: {
            title: title,
            body: `Downloaded by ${settings.botName}`,
            thumbnailUrl: firstVideo.thumbnail,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: message });

      // Cleanup
      fs.unlinkSync(outputPath);

      // Delete status message (optional)
      // await sock.sendMessage(chatId, { delete: statusMsg.key });

    } catch (error) {
      console.error('Play command error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Failed to download: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
