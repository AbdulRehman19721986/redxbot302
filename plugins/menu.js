const { commands } = require('../lib/commandHandler');
const settings = require('../settings');

function createMenuSections() {
  const categories = {};
  commands.forEach(cmd => {
    const cat = cmd.category || 'misc';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  });

  const sections = [];
  for (const [cat, cmds] of Object.entries(categories)) {
    const rows = cmds.slice(0, 10).map(cmd => ({
      title: cmd.command,
      description: cmd.description || '',
      rowId: `cmd_${cmd.command}`
    }));
    sections.push({
      title: cat.toUpperCase(),
      rows: rows
    });
  }
  return sections;
}

module.exports = {
  command: 'menu',
  aliases: ['help', 'commands'],
  category: 'info',
  description: 'Show all commands',
  usage: '.menu',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });

    const sections = createMenuSections();
    const listMessage = {
      text: `*${settings.botName} Commands*`,
      footer: `Powered by ${settings.botOwner} & Muzamil Khan`,
      title: '📋 MENU',
      buttonText: 'Select Category',
      sections: sections
    };
    await sock.sendMessage(chatId, listMessage, { quoted: message });
  }
};
