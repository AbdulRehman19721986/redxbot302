const settings = require('../settings');
const axios = require('axios');

const REPO_IMAGE_URL = 'https://d.uguu.se/rdsobzqr.jpg'; // same image as menu

module.exports = {
  command: 'repo',
  aliases: ['repository', 'github'],
  category: 'main',
  description: 'Show REDXBOT302 repository information',
  usage: '.repo',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    // Build repository information text with emojis
    let repoText = `╭─〔 *REDXBOT302 REPOSITORY* 〕─⊷\n`;
    repoText += `│\n`;
    repoText += `├─ 📌 *Repository Name:* REDXBOT302\n`;
    repoText += `├─ 👑 *Owner:* Abdul Rehman Rajpoot & Muzamil Khan\n`;
    repoText += `├─ ⭐ *Stars:* 100+\n`;
    repoText += `├─ ⑂ *Forks:* 50+\n`;
    repoText += `├─ 📝 *Description:* Advanced WhatsApp Bot with 100+ features – group management, downloads, AI, stickers, and more.\n`;
    repoText += `│\n`;
    repoText += `├─ 🔗 *GitHub Link:*\n`;
    repoText += `│   https://github.com/AbdulRehman19721986/redxbot302\n`;
    repoText += `│\n`;
    repoText += `├─ 🤖 *Pair Link:*\n`;
    repoText += `│   http://redxpair.gt.tc\n`;
    repoText += `│\n`;
    repoText += `├─ 🌐 *Join Channel:*\n`;
    repoText += `│   https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10\n`;
    repoText += `╰───────────────────⊷\n\n`;
    repoText += `✨ *Powered by Abdul Rehman Rajpoot & Muzamil Khan* ✨\n`;
    repoText += `🔗 *Join Channel:* https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10`;

    // Fetch image buffer
    let imageBuffer;
    try {
      const response = await axios.get(REPO_IMAGE_URL, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } catch (err) {
      console.error('Failed to fetch repo image:', err.message);
      // Fallback: send only text
      return await sock.sendMessage(chatId, {
        text: repoText,
        ...channelInfo
      }, { quoted: message });
    }

    // Send image with caption
    await sock.sendMessage(chatId, {
      image: imageBuffer,
      caption: repoText,
      ...channelInfo
    }, { quoted: message });
  }
};
