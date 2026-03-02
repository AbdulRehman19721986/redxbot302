const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');

module.exports = {
  command: 'allmenu',
  aliases: ['allcmd', 'listall'],
  category: 'main',
  description: 'Show all available commands in a compact list',
  usage: '.allmenu',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    // Get all commands grouped by category
    const categories = Array.from(commandHandler.categories.keys()).sort();
    const totalCommands = commandHandler.commands.size;

    let text = `╔══════《 *${settings.botName} – ALL COMMANDS* 》══════╗\n\n`;
    text += `👑 *Owner:* Abdul Rehman Rajpoot & Muzamil Khan\n`;
    text += `📌 *Prefix:* ${settings.prefixes.join(', ')}\n`;
    text += `📊 *Total Commands:* ${totalCommands}\n\n`;

    categories.forEach(cat => {
      const cmdList = commandHandler.getCommandsByCategory(cat);
      text += `╠═══《 *${cat.toUpperCase()}* 》═══╣\n`;
      cmdList.forEach(cmd => {
        const cmdObj = commandHandler.commands.get(cmd);
        text += `║ ✦ *${cmd}* – ${cmdObj?.description || 'No description'}\n`;
      });
      text += `║ 📌 *Total: ${cmdList.length}*\n\n`;
    });

    text += `╚════════════════════════════════════╝\n\n`;
    text += `🔗 *Channel:* ${settings.channelLink}`;

    await sock.sendMessage(chatId, {
      text,
      ...channelInfo
    }, { quoted: message });
  }
};
