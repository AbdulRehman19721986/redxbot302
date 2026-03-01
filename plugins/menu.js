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
    
    let menuText = `╭━━『 *${settings.botName}* 』━⬣\n`;
    menuText += `┃ ✨ Bot: ${settings.botName}\n`;
    menuText += `┃ 🔧 Prefix: ${settings.prefixes.join(', ')}\n`;
    menuText += `┃ 📦 Plugin: ${commands.size}\n`;
    menuText += `┃ 💎 Version: ${settings.version}\n`;
    menuText += `┃ ⏰ Time: ${new Date().toLocaleTimeString()}\n`;
    menuText += `┃ 💾 RAM: ${ramUsage} MB\n`;
    menuText += `┃ 🖥️ CPU: ${cpuLoad}\n`;
    menuText += `┃ 🕒 Uptime: ${formatUptime(uptime)}\n`;
    menuText += `┃━━━ INFO ━✦\n`;
    menuText += `┃ ➤ .owner\n`;
    menuText += `┃ ➤ .repo\n`;
    menuText += `┃ ➤ .alive\n`;
    menuText += `┃ ➤ .ping\n`;
    menuText += `┃━━━ DOWNLOAD ━✦\n`;
    menuText += `┃ ➤ .play\n`;
    menuText += `┃ ➤ .video\n`;
    menuText += `┃ ➤ .drama\n`;
    menuText += `┃ ➤ .movie\n`;
    menuText += `┃ ➤ .tiktok\n`;
    menuText += `┃ ➤ .instagram\n`;
    menuText += `┃ ➤ .twitter\n`;
    menuText += `┃━━━ AI ━✦\n`;
    menuText += `┃ ➤ .gpt\n`;
    menuText += `┃ ➤ .imagine\n`;
    menuText += `┃━━━ GENERAL ━✦\n`;
    menuText += `┃ ➤ .sticker\n`;
    menuText += `┃ ➤ .tts\n`;
    menuText += `┃ ➤ .weather\n`;
    menuText += `┃ ➤ .quote\n`;
    menuText += `┃ ➤ .calc\n`;
    menuText += `┃━━━ GROUP ━✦\n`;
    menuText += `┃ ➤ .tagall\n`;
    menuText += `┃ ➤ .kick\n`;
    menuText += `┃ ➤ .add\n`;
    menuText += `┃ ➤ .promote\n`;
    menuText += `┃ ➤ .demote\n`;
    menuText += `┃━━━ OWNER ━✦\n`;
    menuText += `┃ ➤ .setpp\n`;
    menuText += `┃ ➤ .restart\n`;
    menuText += `┃━━━ MISC ━✦\n`;
    menuText += `┃ ➤ .animu\n`;
    menuText += `┃ ➤ .audiofx\n`;
    menuText += `┃ ➤ .canvas\n`;
    menuText += `┃ …\n`;
    menuText += `╰━━━━━━━━━━━━━⬣\n\n`;
    menuText += `✨ *Powered by Abdul Rehman Rajpoot & Muzamil Khan* ✨\n`;
    menuText += `🔗 Join our Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10`;
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
        const menuText = getNeonMenu();
        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
};
