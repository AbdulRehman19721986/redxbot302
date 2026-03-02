const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const store = require('../lib/lightweight_store');
const axios = require('axios');

const MENU_IMAGE_URL = 'https://d.uguu.se/rdsobzqr.jpg';

module.exports = {
  command: 'menu',
  aliases: ['help', 'cmd'],
  category: 'main',
  description: 'Show stylish interactive menu',
  usage: '.menu',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    // Get runtime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    // Get bot mode
    const botMode = await store.getBotMode();

    // Total commands
    const totalCommands = commandHandler.commands.size;
    const prefix = settings.prefixes[0];

    // Build header
    let menuText = `╭┈───〔 *${settings.botName}* 〕┈───⊷\n`;
    menuText += `├▢ 🤖 *Owner:* ${settings.botOwner} & ${settings.secondOwner}\n`;
    menuText += `├▢ 📜 *Commands:* ${totalCommands}\n`;
    menuText += `├▢ ⏱️ *Runtime:* ${uptimeString}\n`;
    menuText += `├▢ 📡 *Baileys:* Multi Device\n`;
    menuText += `├▢ ☁️ *Platform:* Railway\n`;
    menuText += `├▢ 📦 *Prefix:* ${prefix}\n`;
    menuText += `├▢ ⚙️ *Mode:* ${botMode}\n`;
    menuText += `├▢ 🏷️ *Version:* ${settings.version}\n`;
    menuText += `╰───────────────────⊷\n\n`;

    // Categories
    const categories = Array.from(commandHandler.categories.keys()).sort();
    for (const cat of categories) {
      const cmdList = commandHandler.getCommandsByCategory(cat);
      if (cmdList.length === 0) continue;

      menuText += `『 *${cat.toUpperCase()}* 』\n`;
      menuText += `╭───────────────────⊷\n`;
      cmdList.forEach(cmd => {
        menuText += `┋ ⬡ *${cmd}*\n`;
      });
      menuText += `╰───────────────────⊷\n\n`;
    }

    // Footer
    menuText += `> *© Powered by REDX BOT*\n`;
    menuText += `📢 *Channel:* 120363405513439052@newsletter`;

    // Fetch image
    let imageBuffer;
    try {
      const response = await axios.get(MENU_IMAGE_URL, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } catch (err) {
      console.error('Failed to fetch menu image:', err.message);
      // Fallback: send only text
      return await sock.sendMessage(chatId, {
        text: menuText,
        ...channelInfo
      }, { quoted: message });
    }

    // Send image with caption
    await sock.sendMessage(chatId, {
      image: imageBuffer,
      caption: menuText,
      ...channelInfo
    }, { quoted: message });
  }
};
