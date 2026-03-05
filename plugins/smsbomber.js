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
            const api = `https://fam-official.serv00.net/api/database.php?number=${number}`;
            const response = await axios.get(api, { 
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/html, */*',
                    'Referer': 'https://fam-official.serv00.net/',
                    'Origin': 'https://fam-official.serv00.net'
                }
            });
            
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                const data = response.data;
                if (data && (data.status === 'success' || data.number)) {
                    let reply = `📱 *SIM Database Result*\n\n`;
                    reply += `📞 *Number:* ${data.number || number}\n`;
                    reply += `🆔 *CNIC:* ${data.cnic || 'N/A'}\n`;
                    reply += `👤 *Name:* ${data.name || 'N/A'}\n`;
                    reply += `📍 *Address:* ${data.address || 'N/A'}\n`;
                    reply += `📡 *Network:* ${data.network || 'N/A'}`;
                    return await sock.sendMessage(chatId, { text: reply }, { quoted: message });
                } else {
                    throw new Error('API returned error: ' + JSON.stringify(data));
                }
            } else {
                const html = response.data;
                if (html.includes('not a bot') || html.includes('captcha')) {
                    throw new Error('The service is protected by bot detection. Please try again later or use a different service.');
                } else {
                    throw new Error('Unexpected response from server.');
                }
            }
        } catch (error) {
            console.error('SIM database error:', error);
            let errorMsg = '❌ SIM database lookup failed.\n';
            if (error.response) {
                errorMsg += `API returned ${error.response.status}`;
                if (error.response.status === 403) {
                    errorMsg += ' – access forbidden. The service may be down or blocked.';
                } else if (error.response.status === 404) {
                    errorMsg += ' – endpoint not found.';
                } else {
                    errorMsg += ' – ' + (error.response.data ? String(error.response.data).substring(0, 100) : '');
                }
            } else if (error.request) {
                errorMsg += 'No response from server. The service might be offline.';
            } else {
                errorMsg += error.message;
            }
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
        }
    }
};
