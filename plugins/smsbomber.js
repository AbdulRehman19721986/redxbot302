const axios = require('axios');

module.exports = {
    command: 'smsbomber',
    aliases: ['bomb', 'smspanic'],
    category: 'tools',
    description: 'Send multiple SMS to a Pakistani number (use with caution)',
    usage: '.smsbomber 923001234567',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const number = args[0];
        if (!number || !number.startsWith('92') || number.length < 11) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Please provide a valid Pakistani number starting with 92.\nExample: .smsbomber 923001234567' 
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: '⏳ Sending SMS bomb...' }, { quoted: message });

        try {
            const api = `https://shadowscriptz.xyz/shadowapisv4/smsbomberapi.php?number=${number}`;
            const { data } = await axios.get(api);
            
            if (data.status === 'success') {
                await sock.sendMessage(chatId, { 
                    text: `✅ SMS bomb sent successfully!\n\nMessage: ${data.message || 'Check your phone.'}` 
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { 
                    text: `❌ Failed: ${data.message || 'Unknown error'}` 
                }, { quoted: message });
            }
        } catch (e) {
            console.error('SMS bomber error:', e);
            await sock.sendMessage(chatId, { 
                text: '❌ Error accessing SMS bomber service.' 
            }, { quoted: message });
        }
    }
};
