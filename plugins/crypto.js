const axios = require('axios');
module.exports = [{
  pattern: "crypto",
  alias: ["btc", "eth"],
  desc: "Get cryptocurrency price",
  category: "utility",
  react: "💰",
  filename: __filename,
  use: ".crypto <coin>",
  execute: async (conn, mek, m, { from, args, q, reply }) => {
    try {
      if (!args.length) return reply("❌ Please provide coin name.\nExample: .crypto bitcoin");
      
      const coin = args[0].toLowerCase();
      const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,gbp,eur,inr&include_24hr_change=true`);
      
      const data = res.data[coin];
      if (!data) throw new Error("Coin not found");
      
      const info = `
💰 *${coin.toUpperCase()} Price*
🇺🇸 USD: $${data.usd}
🇪🇺 EUR: €${data.eur}
🇬🇧 GBP: £${data.gbp}
🇮🇳 INR: ₹${data.inr}
📈 24h Change: ${data.usd_24h_change?.toFixed(2)}%
      `;
      
      await reply(info);
      
    } catch (e) {
      await reply(`❌ Error: ${e.message}`);
    }
  }
}];
