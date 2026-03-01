const { commands } = require('../lib/commandHandler');
const settings = require('../settings');
const os = require('os');
const process = require('process');

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getNeonMenu() {
    const uptime = process.uptime();
    const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const cpuLoad = os.loadavg()[0].toFixed(2);
    
    // Group commands by category
    const categories = {};
    commands.forEach(cmd => {
        const cat = cmd.category || 'misc';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.command);
    });

    let menuText = `╭━━『 *${settings.botName}* 』━⬣\n`;
    menuText += `┃ ✨ Bot: ${settings.botName}\n`;
    menuText += `┃ 🔧 Prefix: ${settings.prefixes.join(', ')}\n`;
    menuText += `┃ 📦 Plugin: ${commands.size}\n`;
    menuText += `┃ 💎 Version: ${settings.version}\n`;
    menuText += `┃ ⏰ Time: ${new Date().toLocaleTimeString()}\n`;
    menuText += `┃ 💾 RAM: ${ramUsage} MB\n`;
    menuText += `┃ 🖥️ CPU: ${cpuLoad}\n`;
    menuText += `┃ 🕒 Uptime: ${formatUptime(uptime)}\n`;

    // Add categories and their commands
    const sortedCategories = Object.keys(categories).sort();
    for (const cat of sortedCategories) {
        menuText += `┃━━━ ${cat.toUpperCase()} ━✦\n`;
        categories[cat].slice(0, 5).forEach(cmd => {
            menuText += `┃ ➤ .${cmd}\n`;
        });
        if (categories[cat].length > 5) {
            menuText += `┃ … (+${categories[cat].length - 5} more)\n`;
        }
    }

    menuText += `╰━━━━━━━━━━━━━⬣\n\n`;
    menuText += `✨ *Powered by ${settings.botOwner} & Muzamil Khan* ✨\n`;
    menuText += `🔗 Join our Channel: ${settings.channelLink}`;
    return menuText;
}

module.exports = {
    command: 'menu',
    aliases: ['help', 'commands'],
    category: 'info',
    description: 'Show all available commands',
    usage: '.menu',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        
        // Send an emoji reaction to indicate menu is loading
        await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });
        
        const menuText = getNeonMenu();
        // Try to send image + caption if profile picture is available
        try {
            const response = await fetch(settings.botDp || 'https://files.catbox.moe/s36b12.jpg');
            const buffer = await response.arrayBuffer();
            await sock.sendMessage(chatId, { 
                image: Buffer.from(buffer), 
                caption: menuText 
            }, { quoted: message });
        } catch (e) {
            // Fallback to text only
            await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
        }
    }
};
