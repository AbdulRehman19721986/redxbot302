const settings = require('../settings');

module.exports = {
    command: 'session',
    aliases: ['getsession', 'mysession'],
    category: 'owner',
    description: 'Get your session details (owner only)',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const reply = `✅ *SESSION GENERATED SUCCESSFULLY*\n\n` +
            `Give a star to repo for courage 🌟\n${settings.githubRepo}\n\n` +
            `Support Group for query 💭\n${settings.telegramGroup}\n${settings.whatsappChannel}\n\n` +
            `YouTube tutorials 🪄\n${settings.youtube}\n\n` +
            `${settings.botName} – WhatsApp Bot 🥀\n` +
            `👑 Owner: ${settings.botOwner} & ${settings.secondOwner}`;
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    }
};
