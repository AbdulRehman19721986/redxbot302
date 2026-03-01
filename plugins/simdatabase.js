const axios = require('axios');

module.exports = {
    command: 'simdatabase',
    aliases: ['simdb', 'cnicinfo'],
    category: 'tools',
    description: 'Get SIM owner info (Pakistan) – provide phone number with 92',
    usage: '.simdatabase 923XXXXXXXXX',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const number = args[0];
        if (!number || !number.startsWith('92') || number.length < 11) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a valid Pakistani number starting with 92.\nExample: .simdatabase 923001234567' }, { quoted: message });
        }

        try {
            const api = `https://shadowscriptz.xyz/shadowapisv4/smsbomberapi.php?number=${number}`;
            const { data } = await axios.get(api);
            if (data.status !== 'success') {
                return await sock.sendMessage(chatId, { text: '❌ SIM database lookup failed.' }, { quoted: message });
            }
            const info = data.data;
            let reply = `📱 *SIM Database Result*\n\n`;
            reply += `📞 *Number:* ${info.number}\n`;
            reply += `🆔 *CNIC:* ${info.cnic}\n`;
            reply += `👤 *Name:* ${info.name}\n`;
            reply += `📍 *Address:* ${info.address}\n`;
            reply += `📡 *Network:* ${info.network}`;
            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
        } catch (e) {
            console.error('SIM database error:', e);
            await sock.sendMessage(chatId, { text: '❌ Error accessing SIM database.' }, { quoted: message });
        }
    }
};
