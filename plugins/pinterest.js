const axios = require('axios');
module.exports = [{
  pattern: "pinterest",
  alias: ["pin", "pindl"],
  desc: "Download Pinterest images",
  category: "downloader",
  react: "📌",
  filename: __filename,
  use: ".pinterest <query>",
  execute: async (conn, mek, m, { from, args, q, reply }) => {
    try {
      if (!args.length) return reply("❌ Please provide search term.\nExample: .pinterest nature wallpaper");
      
      const query = args.join(" ");
      await reply("🔍 Searching Pinterest...");
      
      const res = await axios.get(`https://api.maher-zubair.tech/search/pinterest?q=${encodeURIComponent(query)}`);
      if (!res.data || !res.data.result || res.data.result.length === 0) throw new Error("No images found");
      
      const images = res.data.result.slice(0, 5);
      
      for (let img of images) {
        await conn.sendMessage(from, {
          image: { url: img },
          caption: `📌 Pinterest Result`
        }, { quoted: mek });
        await new Promise(r => setTimeout(r, 1000));
      }
      
    } catch (e) {
      await reply(`❌ Error: ${e.message}`);
    }
  }
}];
