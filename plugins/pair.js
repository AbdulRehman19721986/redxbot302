const axios = require('axios');

module.exports = {
  command: 'pair',
  aliases: ['getcode', 'pairing'],
  category: 'utility',
  description: 'Get a WhatsApp pairing code using your phone number',
  usage: '.pair <phone number> (e.g., .pair 923009842133)',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join('').trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: "❌ *Missing Number*\nExample: .pair 923009842133",
        ...channelInfo
      }, { quoted: message });
    }

    // Remove any non-digit characters
    const number = query.replace(/[^0-9]/g, '');

    if (number.length < 10 || number.length > 15) {
      return await sock.sendMessage(chatId, {
        text: "❌ *Invalid Format*\nPlease provide the number with country code but without + or spaces.\nExample: 923009842133",
        ...channelInfo
      }, { quoted: message });
    }

    // Send "requesting" message
    await sock.sendMessage(chatId, {
      text: "⏳ *Requesting pairing code from server...*",
      ...channelInfo
    }, { quoted: message });

    try {
      // Call your backend pairing API
      const response = await axios.get(`https://redxmainpair-production.up.railway.app/pair?number=${number}`, {
        timeout: 30000 // 30 seconds timeout
      });

      // Assume the API returns JSON with a "code" field
      if (response.data && response.data.code) {
        const pairingCode = response.data.code;

        // Check if the code indicates an error (sometimes APIs return error messages)
        if (pairingCode.includes("Unavailable") || pairingCode.includes("Error")) {
          throw new Error("Server returned an error: " + pairingCode);
        }

        const successText = `✅ *REDXBOT PAIRING CODE*\n\n` +
                            `Code: *${pairingCode}*\n\n` +
                            `*How to use:*\n` +
                            `1. Open WhatsApp Settings\n` +
                            `2. Tap 'Linked Devices'\n` +
                            `3. Tap 'Link a Device'\n` +
                            `4. Select 'Link with phone number instead'\n` +
                            `5. Enter the code above.\n\n` +
                            `_Code expires in 5 minutes._`;

        await sock.sendMessage(chatId, {
          text: successText,
          ...channelInfo
        }, { quoted: message });

      } else {
        // If no code field, maybe the response is plain text
        if (response.data && typeof response.data === 'string') {
          // If it's a plain text code, send it
          if (response.data.match(/^\d{6,8}$/)) {
            await sock.sendMessage(chatId, {
              text: `✅ *Your pairing code:* ${response.data}`,
              ...channelInfo
            }, { quoted: message });
          } else {
            throw new Error("Unexpected response format");
          }
        } else {
          throw new Error("Invalid response from server");
        }
      }

    } catch (error) {
      console.error('Pairing Plugin Error:', error.message);

      let errorMsg = "❌ *Pairing Failed*\n\nReason: ";

      if (error.code === 'ECONNABORTED') {
        errorMsg += "Server timeout. Please try again in a few moments.";
      } else if (error.response) {
        // Server responded with an error status
        if (error.response.status === 400) {
          errorMsg += "Invalid phone number format. Please check your number.";
        } else if (error.response.status === 429) {
          errorMsg += "Too many requests. Please wait a minute and try again.";
        } else if (error.response.status === 503) {
          errorMsg += "Server is busy. Please try again later.";
        } else {
          errorMsg += `Server error (${error.response.status}). Please try again later.`;
        }
      } else if (error.request) {
        // No response received
        errorMsg += "Could not reach the pairing server. It may be offline.";
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
