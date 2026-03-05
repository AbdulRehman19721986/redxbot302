// plugins/husband.js
module.exports = {
  command: 'husband',
  aliases: ['shohar'],
  category: 'fun',
  description: 'Pick a random group member as your husband',
  usage: '.husband',
  
  async handler(sock, message, args, context) {
    const { chatId, isGroup } = context;
    
    if (!isGroup) {
      return await sock.sendMessage(chatId, {
        text: '❌ This command can only be used in groups!'
      }, { quoted: message });
    }
    
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const eligible = participants.filter(p => p.id !== botNumber);
      
      if (eligible.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No eligible members found.'
        }, { quoted: message });
      }
      
      const randomMember = eligible[Math.floor(Math.random() * eligible.length)];
      const mention = randomMember.id;
      
      await sock.sendMessage(chatId, {
        text: `💍 *Congratulations!*\n\nYour husband is: @${mention.split('@')[0]}\n\n👰‍♀️ May you have a happy life together!`,
        mentions: [mention]
      }, { quoted: message });
      
    } catch (error) {
      console.error('Husband command error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to pick a husband. Try again later.'
      }, { quoted: message });
    }
  }
};
