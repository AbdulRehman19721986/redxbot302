const axios = require('axios');
module.exports = [{
  pattern: "movie",
  alias: ["moviedl", "film"],
  desc: "Download movies by name",
  category: "downloader",
  react: "🎬",
  filename: __filename,
  use: ".movie <name>",
  execute: async (conn, mek, m, { from, args, q, reply }) => {
    try {
      if (!args.length) return reply("❌ Please provide movie name.\nExample: .movie Inception");
      
      const query = args.join(" ");
      await reply("🔍 Searching for movie...");
      
      // Search movie (using multiple APIs for reliability)
      let movieData;
      try {
        const searchRes = await axios.get(`https://api.maher-zubair.tech/search/imdb?q=${encodeURIComponent(query)}`);
        movieData = searchRes.data;
      } catch (e) {
        try {
          const fallbackRes = await axios.get(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(query)}`);
          movieData = fallbackRes.data;
        } catch (e2) {
          throw new Error("Movie not found");
        }
      }
      
      const caption = `
🎬 *${movieData.title}* (${movieData.year})
📊 *Rating:* ${movieData.rating || 'N/A'}/10
⏱️ *Runtime:* ${movieData.runtime || 'N/A'}
🎭 *Genre:* ${movieData.genre || 'N/A'}
🎬 *Director:* ${movieData.director || 'N/A'}
📝 *Plot:* ${movieData.plot?.substring(0, 200) || 'N/A'}...
🔗 *IMDb:* ${movieData.imdburl || 'N/A'}
      `;
      
      await conn.sendMessage(from, {
        image: { url: movieData.poster || 'https://files.catbox.moe/s36b12.jpg' },
        caption: caption
      }, { quoted: mek });
      
    } catch (e) {
      await reply(`❌ Error: ${e.message}`);
    }
  }
}];
