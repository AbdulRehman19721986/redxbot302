// plugins/gimage.js
const axios = require('axios');
const settings = require('../settings');

// Maximum images allowed per request to prevent abuse
const MAX_IMAGES = 30;

module.exports = {
  command: 'gimage',
  aliases: ['gimg', 'googleimage'],
  category: 'download',
  description: 'Search and download multiple images',
  usage: '.gimage <search term> [number]',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    if (args.length === 0) {
      return await sock.sendMessage(chatId, {
        text: '🖼️ *Google Image Downloader*\n\nUsage:\n.gimage <search term> [number]\n\nExamples:\n.gimage cute cats 10\n.gimage mountains',
        ...channelInfo
      }, { quoted: message });
    }

    // Parse number of images
    let numImages = 5; // default
    let query = args.join(' ');
    
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && args.length > 1) {
      numImages = parseInt(lastArg);
      query = args.slice(0, -1).join(' ');
    }
    
    // Enforce maximum limit
    if (numImages > MAX_IMAGES) {
      return await sock.sendMessage(chatId, {
        text: `⚠️ Maximum allowed images is ${MAX_IMAGES}. Please request a lower number.`,
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for "${query}"...`,
      ...channelInfo
    }, { quoted: message });

    try {
      // Step 1: Search for images
      const searchUrl = `https://jawad-tech.vercel.app/search/gimage?q=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 15000 });

      if (!searchRes.data?.status || !Array.isArray(searchRes.data?.result)) {
        throw new Error('Invalid API response');
      }

      const allResults = searchRes.data.result;
      if (allResults.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No images found. Try a different search term.',
          ...channelInfo
        }, { quoted: message });
      }

      // Remove duplicate URLs
      const seenUrls = new Set();
      const uniqueResults = [];
      for (const item of allResults) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          uniqueResults.push(item);
        }
      }

      const totalAvailable = uniqueResults.length;
      const toDownload = Math.min(numImages, totalAvailable);
      
      await sock.sendMessage(chatId, {
        text: `✅ Found ${totalAvailable} unique images. Downloading ${toDownload}...`,
        ...channelInfo
      }, { quoted: message });

      // Step 2: Download and send each image
      let successCount = 0;
      const failedIndices = [];

      for (let i = 0; i < toDownload; i++) {
        const img = uniqueResults[i];
        
        try {
          // Download image as buffer with proper headers
          const imgResponse = await axios.get(img.url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const imageBuffer = Buffer.from(imgResponse.data);
          
          // Send image with caption
          const caption = `🖼️ *${query}*\n📸 Image ${i+1}/${toDownload}\n📏 ${img.width || '?'}×${img.height || '?'}`;
          
          await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            ...channelInfo
          }, { quoted: message });
          
          successCount++;
          
          // Delay between sends to avoid spam
          if (i < toDownload - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
        } catch (imgError) {
          console.error(`Failed to download image ${i+1}:`, imgError.message);
          failedIndices.push(i+1);
        }
      }

      // Final summary
      let summary = `✅ Downloaded ${successCount} image${successCount !== 1 ? 's' : ''}`;
      if (failedIndices.length > 0) {
        summary += `\n❌ Failed: ${failedIndices.join(', ')}`;
      }
      await sock.sendMessage(chatId, {
        text: summary,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('❌ GImage command error:', error);
      let errorMsg = '❌ Image search failed.\n';
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
