module.exports = {
  command: 'jid',
  aliases: ['getjid', 'channelid'],
  category: 'tools',
  description: 'Get JID of a group, channel, or user',
  usage: '.jid [url]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    let target = args[0] || message.key.remoteJid;
    if (target.includes('whatsapp.com/channel/')) {
      const code = target.split('/').pop();
      try {
        const metadata = await sock.newsletterMetadata('invite', code);
        return await sock.sendMessage(chatId, { text: `Channel JID: ${metadata.id}` }, { quoted: message });
      } catch (e) {
        return await sock.sendMessage(chatId, { text: '❌ Invalid channel link.' }, { quoted: message });
      }
    }
    if (target.includes('chat.whatsapp.com/')) {
      const code = target.split('/').pop();
      try {
        const metadata = await sock.groupInviteInfo(code);
        return await sock.sendMessage(chatId, { text: `Group JID: ${metadata.id}` }, { quoted: message });
      } catch (e) {
        return await sock.sendMessage(chatId, { text: '❌ Invalid group link.' }, { quoted: message });
      }
    }
    if (!target.includes('@')) target = target + '@s.whatsapp.net';
    await sock.sendMessage(chatId, { text: `JID: ${target}` }, { quoted: message });
  }
};
