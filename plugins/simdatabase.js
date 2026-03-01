const axios = require('axios');

module.exports = {
    command: 'simdatabase',
    aliases: ['simdb', 'cnicinfo'],
    category: 'tools',
    description: 'Get SIM owner info (Pakistan) – provide phone number',
    usage: '.simdatabase 3009842133',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const number = args[0];
        if (!number || number.length < 10) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Please provide a valid phone number.\nExample: .simdatabase 3009842133' 
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: '⏳ Fetching SIM database info...' }, { quoted: message });

        try {
            // Using the API you provided
            const api = `https://fam-official.serv00.net/api/database.php?number=${number}`;
            const { data } = await axios.get(api);
            
            // Note: The actual response format is unknown (the URL returned a forbidden error).
            // You'll need to inspect the real response and adjust parsing.
            if (data && data.status === 'success') {
                let reply = `📱 *SIM Database Result*\n\n`;
                reply += `📞 *Number:* ${data.number || number}\n`;
                reply += `🆔 *CNIC:* ${data.cnic || 'N/A'}\n`;
                reply += `👤 *Name:* ${data.name || 'N/A'}\n`;
                reply += `📍 *Address:* ${data.address || 'N/A'}\n`;
                reply += `📡 *Network:* ${data.network || 'N/A'}`;
                await sock.sendMessage(chatId, { text: reply }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { 
                    text: '❌ SIM database lookup failed. No data returned.' 
                }, { quoted: message });
            }
        } catch (e) {
            console.error('SIM database error:', e);
            await sock.sendMessage(chatId, { 
                text: '❌ Error accessing SIM database.' 
            }, { quoted: message });
        }
    }
};
