const settings = require('../settings');

module.exports = {
    command: 'repo',
    aliases: ['repository', 'github'],
    category: 'info',
    description: 'Show bot repository information',
    usage: '.repo',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const repoMsg = `╭─〔 *${settings.botName} REPOSITORY* 〕\n│\n├─ 📌 Repository Name: REDXBOT302\n├─ 👑 Owner: ${settings.botOwner}\n├─ ⭐ Stars: 100+\n├─ ⑂ Forks: 50+\n├─ 📝 Description: ${settings.description}\n│\n├─ 🔗 GitHub Link:\n│   ${settings.githubRepo}\n│\n├─ 🤖 Pair Link:\n│   http://redxpair.gt.tc\n│\n├─ 🌐 Join Channel:\n│   ${settings.channelLink}\n╰───────────────────⊷`;
        await sock.sendMessage(chatId, { text: repoMsg }, { quoted: message });
    }
};
