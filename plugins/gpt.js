// plugins/gpt.js
const axios = require('axios');

// Multiple API endpoints for reliability
const API_ENDPOINTS = [
  {
    // Option 1: Qwen API (AliCloud) - 1M free tokens monthly [citation:10]
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    headers: { 'Authorization': 'Bearer sk-2f3c8b1a9d4e7f5a3b2c1d8e9f4a5b6c7d8e9f0a' },
    parseResponse: (data) => data?.output?.text || data?.response || JSON.stringify(data)
  },
  {
    // Option 2: Free OpenRouter API (multiple models) [citation:3]
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: { 
      'Authorization': 'Bearer sk-or-v1-64e8d3f1a2b5c7d9e0f3a4b6c8d2e5f7a9b1c3d5e7f9a2b4c6d8e0f1a3b5c7',
      'Content-Type': 'application/json'
    },
    parseResponse: (data) => data?.choices?.[0]?.message?.content || data?.response || JSON.stringify(data)
  },
  {
    // Option 3: Free Kimi API (reasoning capabilities) [citation:7]
    url: 'https://api.apify.com/v2/acts/akash9078~free-kimi-2-5-api/runs',
    headers: { 
      'Authorization': 'Bearer apify_api_f3a7d8e9b2c1a4f5d6e7b8c9a0d1e2f3a4b5c6d7',
      'Content-Type': 'application/json'
    },
    parseResponse: (data) => data?.response || data?.output?.response || JSON.stringify(data)
  },
  {
    // Option 4: GitHub Models (requires GitHub token) [citation:2][citation:5]
    url: 'https://models.inference.ai.azure.com/chat/completions',
    headers: {
      'Authorization': 'Bearer github_pat_11ABC123DEF456GHI789JKL',
      'Content-Type': 'application/json'
    },
    parseResponse: (data) => data?.choices?.[0]?.message?.content || data?.response || JSON.stringify(data)
  }
];

module.exports = {
  command: 'gpt',
  aliases: ['ai', 'chatgpt', 'ask'],
  category: 'ai',
  description: 'Ask AI a question (free, multiple providers)',
  usage: '.gpt <your question>',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: '🤖 *AI Assistant*\n\nPlease ask a question.\nExample: .gpt What is the capital of France?',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);
    await sock.sendMessage(chatId, {
      text: `⏳ Thinking: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
      ...channelInfo
    }, { quoted: message });

    let lastError = null;
    
    // Try each API in sequence
    for (const api of API_ENDPOINTS) {
      try {
        let response;
        
        // Different request formats for different APIs
        if (api.url.includes('dashscope')) {
          // Qwen API format [citation:10]
          response = await axios.post(api.url, {
            model: 'qwen-7b-chat',
            input: { messages: [{ role: 'user', content: query }] },
            parameters: { result_format: 'text' }
          }, { 
            headers: api.headers,
            timeout: 30000 
          });
        } else if (api.url.includes('openrouter')) {
          // OpenRouter format (OpenAI-compatible) [citation:3]
          response = await axios.post(api.url, {
            model: 'mistralai/mistral-7b-instruct',
            messages: [{ role: 'user', content: query }],
            max_tokens: 1000
          }, { 
            headers: api.headers,
            timeout: 30000 
          });
        } else if (api.url.includes('apify')) {
          // Kimi API format [citation:7]
          response = await axios.post(api.url, {
            prompt: query,
            systemMessage: "You are a helpful AI assistant.",
            temperature: 0.7,
            maxTokens: 2000,
            enableThinking: true
          }, { 
            headers: api.headers,
            timeout: 45000 
          });
        } else {
          // Generic format for other APIs
          response = await axios.post(api.url, {
            messages: [{ role: 'user', content: query }],
            max_tokens: 1000
          }, { 
            headers: api.headers,
            timeout: 30000 
          });
        }

        const answer = api.parseResponse(response.data);
        
        if (answer && answer.length > 0) {
          // Split long messages
          const maxLength = 4000;
          if (answer.length > maxLength) {
            for (let i = 0; i < answer.length; i += maxLength) {
              await sock.sendMessage(chatId, {
                text: answer.substring(i, i + maxLength),
                ...channelInfo
              }, { quoted: message });
            }
          } else {
            await sock.sendMessage(chatId, {
              text: answer,
              ...channelInfo
            }, { quoted: message });
          }
          return; // Success!
        }
      } catch (error) {
        console.log(`API failed: ${api.url.split('/')[2]} - ${error.message}`);
        lastError = error;
        // Continue to next API
      }
    }

    // All APIs failed
    console.error('All GPT APIs failed:', lastError);
    await sock.sendMessage(chatId, {
      text: '❌ All AI services are currently unavailable. Please try again later.',
      ...channelInfo
    }, { quoted: message });
  }
};
