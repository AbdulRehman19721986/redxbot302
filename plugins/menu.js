const handler = require('../lib/commandHandler');
const settings = require('../settings');

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    command: 'menu',
    aliases: ['help', 'cmds'],
    category: 'info',
    description: 'Show all available commands',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });

        const uptime = process.uptime();
        const categories = {};

        // Group commands by category
        handler.commands.forEach((plugin, cmd) => {
            const cat = plugin.category || 'misc';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(`.${cmd}`);
        });

        let menuText = `╔══════『 *${settings.botName}* 』══════╗\n`;
        menuText += `┃ ✨ *Uptime:* ${formatUptime(uptime)}\n`;
        menuText += `┃ 🔧 *Prefix:* ${settings.prefixes.join(', ')}\n`;
        menuText += `┃ 📦 *Commands:* ${handler.commands.size}\n`;
        menuText += `┃━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        // Show all commands, no truncation
        for (const [cat, cmds] of Object.entries(categories)) {
            menuText += `┃ 🔹 *${cat.toUpperCase()}*\n`;
            cmds.forEach(cmd => {
                menuText += `┃    ${cmd}\n`;
            });
        }

        menuText += `╚══════════════════════════╝\n\n`;
        menuText += `✨ *Powered by ${settings.botOwner} & ${settings.secondOwner}* ✨\n`;
        menuText += `🔗 Join Channel: ${settings.channelLink}`;

        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
};
