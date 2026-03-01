const axios = require('axios');

module.exports = {
    command: 'movie',
    aliases: ['downloadmovie'],
    category: 'download',
    description: 'Download movie by name',
    usage: '.movie <movie name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a movie name.' }, { quoted: message });
        }
        try {
            // Replace with a real movie API endpoint
            const api = `https://api.akuari.my.id/movie/search?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(api);
            if (!data || !data.result) {
                return await sock.sendMessage(chatId, { text: '❌ Movie not found.' }, { quoted: message });
            }
            const result = data.result;
            let reply = `🎥 *Movie: ${result.title}*\n📅 Year: ${result.year}\n⭐ Rating: ${result.rating}\n📝 Plot: ${result.plot}\n\n📥 Download: ${result.downloadUrl}`;
            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
        } catch (e) {
            console.error('Movie download error:', e);
            await sock.sendMessage(chatId, { text: '❌ Failed to fetch movie info.' }, { quoted: message });
        }
    }
};
