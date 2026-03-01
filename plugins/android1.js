const Qasim = require('api-qasim');
const axios = require('axios');

module.exports = {
  command: 'android',
  aliases: ['an1', 'an1apk'],
  category: 'apks',
  description: 'Search APKs and download by reply',
  usage: '.android <apk_name>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    try {
      if (!query) {
        return await sock.sendMessage(chatId, { text: '*Please provide an APK name.*\nExample: .android Telegram' }, { quoted: message });
      }

      await sock.sendMessage(chatId, { text: '🔎 Searching for APKs...' }, { quoted: message });

      const res = await Qasim.apksearch(query);

      if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) {
        return await sock.sendMessage(chatId, { text: '❌ No APKs found.' }, { quoted: message });
      }

      const results = res.data;
      const first = results[0];

      let caption = `📱 *APK Search Results for:* *${query}*\n\n`;
      caption += `↩️ *Reply with a number to download*\n\n`;

      results.forEach((item, i) => {
        caption +=
          `*${i + 1}.* ${item.judul}\n` +
          `👨‍💻 Developer: ${item.dev}\n` +
          `⭐ Rating: ${item.rating}\n` +
          `🔗 ${item.link}\n\n`;
      });

      const sentMsg = await sock.sendMessage(chatId, { image: { url: first.thumb }, caption }, { quoted: message });

      const timeout = setTimeout(async () => {
        sock.ev.off('messages.upsert', listener);
        await sock.sendMessage(chatId, { text: '⏱ APK selection expired. Please search again.' }, { quoted: sentMsg });
      }, 5 * 60 * 1000);

      const listener = async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.remoteJid !== chatId) return;

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        if (!ctx?.stanzaId || ctx.stanzaId !== sentMsg.key.id) return;

        const replyText =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          '';

        const choice = parseInt(replyText.trim());
        if (isNaN(choice) || choice < 1 || choice > results.length) {
          return await sock.sendMessage(chatId, { text: `❌ Invalid choice. Pick 1-${results.length}.` }, { quoted: m });
        }

        clearTimeout(timeout);
        sock.ev.off('messages.upsert', listener);

        const selected = results[choice - 1];
        
        await sock.sendMessage(chatId, { text: `⬇️ Downloading *${selected.judul}*...\n⏱ Please wait...` }, { quoted: m });
        const apiUrl =
          `https://discardapi.dpdns.org/api/apk/dl/android1?apikey=guru&url=` +
          encodeURIComponent(selected.link);

        const dlRes = await axios.get(apiUrl);

        const apk = dlRes.data?.result;
        if (!apk?.url) {
          return await sock.sendMessage(chatId, { text: '❌ Failed to get APK download link.' }, { quoted: m });
        }
        const safeName = apk.name.replace(/[^\w.-]/g, '_');

        const apkCaption =
          `📦 *APK Downloaded*\n\n` +
          `📛 Name: ${apk.name}\n` +
          `⭐ Rating: ${apk.rating}\n` +
          `📦 Size: ${apk.size}\n` +
          `📱 Android: ${apk.requirement}\n` +
          `🧒 Age: ${apk.rated}\n` +
          `📅 Published: ${apk.published}\n\n` +
          `📝 Description:\n${apk.description}`;

        await sock.sendMessage(chatId, { document: { url: apk.url }, fileName: `${safeName}.apk`, mimetype: 'application/vnd.android.package-archive', caption: apkCaption }, { quoted: m });
      };

      sock.ev.on('messages.upsert', listener);

    } catch (err) {
      console.error('❌ Android Plugin Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to process APK request.' }, { quoted: message });
    }
  }
};

