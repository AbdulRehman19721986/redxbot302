// plugins/gimg.js
const axios = require('axios');
const settings = require('../settings');

module.exports = {
  command: 'gimg',
  aliases: ['gimage', 'googleimg'],
  category: 'download',
  description: 'Search and download images directly',
  usage: '.gimg <search term> [number of images]',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    if (args.length === 0) {
      return await sock.sendMessage(chatId, {
        text: '🖼️ *Google Image Downloader*\n\nUsage:\n.gimg <search term> [number]\n\nExamples:\n.gimg cute cats\n.gimg mountains 3',
        ...channelInfo
      }, { quoted: message });
    }

    // Parse number of images (default 3, max 5)
    let numImages = 3;
    let query = args.join(' ');
    
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && args.length > 1) {
      numImages = parseInt(lastArg);
      query = args.slice(0, -1).join(' ');
    }
    
    // Limit to reasonable number
    numImages = Math.min(Math.max(numImages, 1), 5);

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

      // Remove duplicates and get unique image URLs
      const seenUrls = new Set();
      const uniqueResults = [];
      for (const item of allResults) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          uniqueResults.push(item);
        }
      }

      const resultsToDownload = uniqueResults.slice(0, numImages);
      
      await sock.sendMessage(chatId, {
        text: `✅ Found ${uniqueResults.length} images. Downloading ${resultsToDownload.length}...`,
        ...channelInfo
      }, { quoted: message });

      // Step 2: Download and send each image
      let successCount = 0;
      for (let i = 0; i < resultsToDownload.length; i++) {
        const img = resultsToDownload[i];
        
        try {
          // Download image as buffer
          const imgResponse = await axios.get(img.url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const imageBuffer = Buffer.from(imgResponse.data);
          
          // Send image with caption
          const caption = `🖼️ *${query}*\n📸 Image ${i+1}/${resultsToDownload.length}\n📏 ${img.width}×${img.height}`;
          
          await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            ...channelInfo
          }, { quoted: message });
          
          successCount++;
          
          // Small delay between sends
          if (i < resultsToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
        } catch (imgError) {
          console.error(`Failed to download image ${i+1}:`, imgError.message);
          // Continue to next image
        }
      }

      if (successCount === 0) {
        await sock.sendMessage(chatId, {
          text: '❌ Failed to download any images. The image sources may be unavailable.',
          ...channelInfo
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `✅ Downloaded ${successCount} image${successCount > 1 ? 's' : ''} successfully!`,
          ...channelInfo
        }, { quoted: message });
      }

    } catch (error) {
      console.error('❌ GIMG command error:', error);
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
