const handler = require('../lib/commandHandler');

module.exports = {
  command: 'menu',
  aliases: ['help', 'cmds'],
  category: 'info',
  description: 'Show all available commands',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;

    // React with emoji
    await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });

    // Group commands by category
    const categories = {};
    handler.commands.forEach((plugin, cmd) => {
      const cat = plugin.category || 'misc';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`.${cmd}`);
    });

    let menuText = `╭━━『 *REDXBOT302* 』━━⬣\n`;
    menuText += `┃ ✨ *Prefix:* ${context.config?.PREFIX || '.'}\n`;
    menuText += `┃ 📦 *Commands:* ${handler.commands.size}\n`;
    menuText += `┃━━━━━━━━━━━━━━━━━\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
      menuText += `┃ 🔹 *${cat.toUpperCase()}*\n`;
      cmds.slice(0, 8).forEach(c => (menuText += `┃    ${c}\n`));
      if (cmds.length > 8) menuText += `┃    ... and ${cmds.length - 8} more\n`;
    }

    menuText += `╰━━━━━━━━━━━━━━━━━⬣\n\n`;
    menuText += `✨ *Powered by Abdul Rehman Rajpoot & Muzamil Khan* ✨\n`;
    menuText += `🔗 Join Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10`;

    await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
  }
};
