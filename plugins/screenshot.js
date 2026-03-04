const axios = require('axios');
module.exports = [{
  pattern: "ss",
  alias: ["screenshot", "webss"],
  desc: "Take website screenshot",
  category: "utility",
  react: "📸",
  filename: __filename,
  use: ".ss <url>",
  execute: async (conn, mek, m, { from, args, q, reply }) => {
    try {
      if (!args.length) return reply("❌ Please provide URL.\nExample: .ss https://example.com");
      
      let url = args[0];
      if (!url.startsWith('http')) url = 'https://' + url;
      
      await reply("⏳ Taking screenshot...");
      
      const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=0551b436bf0642ac8a0a072acb76ed7a&url=${encodeURIComponent(url)}&format=png&width=1280&height=800`;
      
      await conn.sendMessage(from, {
        image: { url: screenshotUrl },
        caption: `📸 Screenshot of: ${url}`
      }, { quoted: mek });
      
    } catch (e) {
      await reply(`❌ Failed to take screenshot.`);
    }
  }
}];
