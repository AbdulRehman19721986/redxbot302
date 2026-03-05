// plugins/gpt.js
const axios = require('axios');

module.exports = {
  command: 'gpt',
  aliases: ['ai', 'chatgpt'],
  category: 'ai',
  description: 'Ask GPT AI a question',
  usage: '.gpt <your question>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🤖 *GPT AI*\n\nPlease ask a question.\nExample: .gpt What is the capital of France?',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);
    await sock.sendMessage(chatId, {
      text: `⏳ Thinking about: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
      ...channelInfo
    }, { quoted: message });

    try {
      const apiUrl = `https://jawad-tech.vercel.app/ai/gpt?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl, { timeout: 30000 });

      // Try to extract the answer from different possible response structures
      let answer = null;
      if (response.data) {
        if (typeof response.data === 'string') {
          answer = response.data;
        } else if (response.data.response) {
          answer = response.data.response;
        } else if (response.data.message) {
          answer = response.data.message;
        } else if (response.data.reply) {
          answer = response.data.reply;
        } else if (response.data.answer) {
          answer = response.data.answer;
        } else if (response.data.result) {
          answer = response.data.result;
        } else {
          // Fallback: stringify the whole response
          answer = JSON.stringify(response.data, null, 2);
        }
      }

      if (!answer) {
        throw new Error('No valid response from API');
      }

      // Send the answer (split if too long)
      const maxLength = 4000;
      if (answer.length > maxLength) {
        const parts = [];
        for (let i = 0; i < answer.length; i += maxLength) {
          parts.push(answer.substring(i, i + maxLength));
        }
        for (const part of parts) {
          await sock.sendMessage(chatId, {
            text: part,
            ...channelInfo
          }, { quoted: message });
        }
      } else {
        await sock.sendMessage(chatId, {
          text: answer,
          ...channelInfo
        }, { quoted: message });
      }

    } catch (error) {
      console.error('❌ GPT command error:', error);
      let errorMsg = '❌ Failed to get response from AI.\n';
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
