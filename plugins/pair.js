// plugins/pair.js
const axios = require('axios');

module.exports = {
  command: 'pair',
  aliases: ['getcode', 'paircode'],
  category: 'owner',
  description: 'Get WhatsApp pairing code using backend',
  usage: '.pair <phone_number> (e.g., .pair 61468259338)',
  ownerOnly: true, // Set to false if you want all users to use it

  async handler(sock, message, args, context) {
    const { chatId, senderIsOwnerOrSudo } = context;

    // Optional: Add extra owner check even if ownerOnly is true
    if (!senderIsOwnerOrSudo) {
      return await sock.sendMessage(chatId, {
        text: '❌ Only owner/sudo can use this command.'
      }, { quoted: message });
    }

    const number = args[0]?.trim();
    if (!number) {
      return await sock.sendMessage(chatId, {
        text: '❌ Please provide a phone number.\nExample: .pair 61468259338'
      }, { quoted: message });
    }

    // Basic validation: only digits allowed
    if (!/^\d+$/.test(number)) {
      return await sock.sendMessage(chatId, {
        text: '❌ Invalid number. Use only digits (no +, spaces, or dashes).'
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: `⏳ Requesting pairing code for *${number}*...`
    }, { quoted: message });

    try {
      // Make the request to your backend
      const apiUrl = `https://redxmainpair-production-6606.up.railway.app/code?number=${number}`;
      const response = await axios.get(apiUrl, { timeout: 30000 });

      // The backend returns a 400 if number is missing (we already validated)
      // Handle successful response
      if (response.data?.code) {
        await sock.sendMessage(chatId, {
          text: `✅ *Pairing Code Generated*\n\n📱 Number: ${number}\n🔑 Code: ${response.data.code}\n\n⏱️ This code expires in 60 seconds.`
        }, { quoted: message });
      } 
      // Handle other expected response formats
      else if (response.data?.pairingCode) {
        await sock.sendMessage(chatId, {
          text: `✅ *Pairing Code*\n\n${response.data.pairingCode}`
        }, { quoted: message });
      }
      else {
        // Unexpected response structure
        console.log('Unexpected API response:', response.data);
        await sock.sendMessage(chatId, {
          text: '❌ Backend returned an unexpected response. Check logs.'
        }, { quoted: message });
      }
    } catch (error) {
      console.error('Pair command error:', error.message);
      
      let errorMsg = '❌ Failed to get pairing code.\n';
      if (error.response) {
        // The request was made and the server responded with a status code outside 2xx
        if (error.response.status === 400) {
          errorMsg += 'Server returned 400 – possibly an invalid number.';
        } else if (error.response.status === 429) {
          errorMsg += 'Rate limited. Please try again later.';
        } else {
          errorMsg += `Server error (${error.response.status}).`;
        }
      } else if (error.request) {
        // The request was made but no response received
        errorMsg += 'No response from backend. It may be down.';
      } else {
        // Something else happened
        errorMsg += error.message;
      }
      
      await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
  }
};
