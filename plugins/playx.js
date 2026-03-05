const yts = require('yt-search');
const axios = require('axios');

const fetchJson = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            },
            ...options,
        });
        return res.data;
    } catch (err) {
        console.error('[ ❌ ] fetchJson error:', err);
        return err;
    }
};

// ==================== PLAY COMMAND (ORIGINAL) ====================
module.exports = {
  command: 'play',
  aliases: ['song', 'mp3'],
  category: 'music',
  description: 'Stream audio from YouTube',
  usage: '.play <song name>',
  
  async handler(sock, message, args) {
    const chatId = message.key.remoteJid;
    const query = args.join(' ');
    
    if (!query) {
      return await sock.sendMessage(chatId, { 
        text: '❌ Please provide a song name!\nExample: .play Moye Moye' 
      });
    }

    try {
      // 1. SEARCH YOUTUBE
      const searchResult = await yts(query);
      const video = searchResult.videos[0];
      
      if (!video) {
        return await sock.sendMessage(chatId, { 
          text: '❌ No results found for your query.' 
        });
      }

      // 2. SEND THUMBNAIL WITH INFO
      const caption = `*🎵 ${video.title}*\n\n⏱️ Duration: ${video.timestamp}\n📢 Channel: ${video.author.name}\n\n🔄 Streaming your audio...`;
      
      await sock.sendMessage(chatId, { 
        image: { url: video.thumbnail },
        caption: caption
      });

      // 3. FETCH STREAM URL FROM API
      const apiUrl = `https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=${video.url}`;
      const apiResponse = await fetchJson(apiUrl);
      
      if (!apiResponse.success || !apiResponse.data.downloadUrl) {
        throw new Error('Failed to get stream link');
      }

      const streamUrl = apiResponse.data.downloadUrl;

      // 4. STREAM DIRECTLY FROM THE URL
      await sock.sendMessage(chatId, {
        audio: { url: streamUrl },
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`
      });

    } catch (error) {
      console.error('Play command error:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ An error occurred while processing your request.\nPlease try again later.' 
      });
    }
  }
};

// ==================== PLAY2 COMMAND (WITH FALLBACK URLs) ====================
module.exports = {
  command: 'play2',
  aliases: ['song2', 'mp3fallback'],
  category: 'music',
  description: 'Stream audio from YouTube with fallback URLs',
  usage: '.play2 <song name>',
  
  async handler(sock, message, args) {
    const chatId = message.key.remoteJid;
    const query = args.join(' ');
    
    if (!query) {
      return await sock.sendMessage(chatId, { 
        text: '❌ Please provide a song name!\nExample: .play2 Moye Moye' 
      });
    }

    try {
      // 1. SEARCH YOUTUBE
      const searchResult = await yts(query);
      const video = searchResult.videos[0];
      
      if (!video) {
        return await sock.sendMessage(chatId, { 
          text: '❌ No results found for your query.' 
        });
      }

      // 2. SEND THUMBNAIL WITH INFO
      const caption = `*🎵 ${video.title}*\n\n⏱️ Duration: ${video.timestamp}\n📢 Channel: ${video.author.name}\n\n🔄 Streaming with fallback URLs...`;
      
      await sock.sendMessage(chatId, { 
        image: { url: video.thumbnail },
        caption: caption
      });

      // 3. FETCH STREAM URLS FROM API
      const apiUrl = `https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=${video.url}`;
      const apiResponse = await fetchJson(apiUrl);
      
      if (!apiResponse.success) {
        throw new Error('Failed to get stream links');
      }

      // 4. COLLECT ALL URLs TO TRY (main + alternatives)
      const urlsToTry = [];
      
      // Add main downloadUrl if exists
      if (apiResponse.data.downloadUrl) {
        urlsToTry.push(apiResponse.data.downloadUrl);
      }
      
      // Add all alternative URLs
      if (apiResponse.data.alternativeUrls && apiResponse.data.alternativeUrls.length > 0) {
        apiResponse.data.alternativeUrls.forEach(alt => {
          urlsToTry.push(alt.url);
        });
      }

      if (urlsToTry.length === 0) {
        throw new Error('No URLs available to try');
      }

      // 5. TRY EACH URL UNTIL ONE WORKS
      let success = false;
      let lastError = null;

      for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i];
        
        try {
          console.log(`Trying URL ${i + 1}/${urlsToTry.length}: ${url}`);
          
          // Test if URL is accessible (quick head request)
          await axios.head(url, { timeout: 5000 });
          
          // If successful, send the audio
          await sock.sendMessage(chatId, {
            audio: { url: url },
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`
          });
          
          success = true;
          console.log(`✅ Success with URL ${i + 1}`);
          break; // Exit loop if successful
          
        } catch (err) {
          console.log(`❌ URL ${i + 1} failed:`, err.message);
          lastError = err;
          // Continue to next URL
        }
      }

      if (!success) {
        throw new Error(`All ${urlsToTry.length} URLs failed. Last error: ${lastError?.message}`);
      }

    } catch (error) {
      console.error('Play2 command error:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ An error occurred while processing your request.\nAll available URLs failed.' 
      });
    }
  }
};
