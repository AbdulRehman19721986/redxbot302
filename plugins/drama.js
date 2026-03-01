const axios = require('axios');

module.exports = {
    command: 'drama',
    aliases: ['downloaddrama'],
    category: 'download',
    description: 'Download drama by name',
    usage: '.drama <drama name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a drama name.' }, { quoted: message });
        }
        try {
            // Replace with a real drama API endpoint
            const api = `https://api.akuari.my.id/drama/search?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(api);
            if (!data || !data.result) {
                return await sock.sendMessage(chatId, { text: '❌ Drama not found.' }, { quoted: message });
            }
            const result = data.result;
            let reply = `🎬 *Drama: ${result.title}*\n📅 Year: ${result.year}\n⭐ Rating: ${result.rating}\n📝 Synopsis: ${result.synopsis}\n\n📥 Download: ${result.downloadUrl}`;
            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
        } catch (e) {
            console.error('Drama download error:', e);
            await sock.sendMessage(chatId, { text: '❌ Failed to fetch drama info.' }, { quoted: message });
        }
    }
};
