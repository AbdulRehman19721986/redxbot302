const axios = require('axios');

module.exports = {
  command: 'drama',
  aliases: ['dramadl'],
  category: 'download',
  description: 'Download drama by name',
  usage: '.drama <name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return await sock.sendMessage(chatId, { text: '❌ Provide drama name.' }, { quoted: message });
    try {
      // Replace with a real drama API endpoint
      const api = `https://api.akuari.my.id/drama/search?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(api);
      if (!data || !data.result) return await sock.sendMessage(chatId, { text: '❌ Drama not found.' }, { quoted: message });
      const drama = data.result;
      let reply = `🎬 *Drama:* ${drama.title}\n📅 Year: ${drama.year}\n⭐ Rating: ${drama.rating}\n📝 Synopsis: ${drama.synopsis}\n\n📥 Download: ${drama.downloadUrl}`;
      await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch drama info.' }, { quoted: message });
    }
  }
};
