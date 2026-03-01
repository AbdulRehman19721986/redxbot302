const axios = require('axios');

module.exports = {
    command: 'movie',
    aliases: ['imdb', 'film'],
    category: 'search',
    description: 'Get movie information (title, year, plot, rating)',
    usage: '.movie <title>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ');
        if (!query) return await sock.sendMessage(chatId, { text: '❌ Provide movie title.' }, { quoted: message });

        try {
            const apiKey = '742b2d09'; // OMDb public key
            const { data } = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${apiKey}&plot=short`);
            if (data.Response === 'False') return await sock.sendMessage(chatId, { text: '❌ Movie not found.' }, { quoted: message });

            const reply = `🎬 *${data.Title}* (${data.Year})\n` +
                `⭐ *IMDb:* ${data.imdbRating}\n` +
                `🎭 *Genre:* ${data.Genre}\n` +
                `🎬 *Director:* ${data.Director}\n` +
                `👥 *Cast:* ${data.Actors}\n` +
                `📝 *Plot:* ${data.Plot}\n` +
                `🌍 *Language:* ${data.Language}\n` +
                `📅 *Released:* ${data.Released}\n` +
                `⏱️ *Runtime:* ${data.Runtime}\n` +
                `🏆 *Awards:* ${data.Awards || 'N/A'}`;

            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
        } catch (e) {
            console.error('Movie error:', e);
            await sock.sendMessage(chatId, { text: '❌ Failed to fetch movie info.' }, { quoted: message });
        }
    }
};
