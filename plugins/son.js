// plugins/son.js
module.exports = {
  command: 'son',
  aliases: ['beta'],
  category: 'fun',
  description: 'Pick a random group member as your son',
  usage: '.son',
  
  async handler(sock, message, args, context) {
    const { chatId, isGroup } = context;
    
    if (!isGroup) {
      return await sock.sendMessage(chatId, {
        text: '❌ This command can only be used in groups!'
      }, { quoted: message });
    }
    
    try {
      // Get group metadata to fetch participants
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants;
      
      // Filter out the bot itself (optional)
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const eligible = participants.filter(p => p.id !== botNumber);
      
      if (eligible.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No eligible members found.'
        }, { quoted: message });
      }
      
      // Pick random member
      const randomMember = eligible[Math.floor(Math.random() * eligible.length)];
      const mention = randomMember.id;
      
      // Get member name (optional)
      let name = randomMember.notify || randomMember.id.split('@')[0];
      
      // Send with mention and animation
      await sock.sendMessage(chatId, {
        text: `👨‍👦 *Congratulations!*\n\nYour son is: @${mention.split('@')[0]}\n\n🎉 Take good care of him!`,
        mentions: [mention]
      }, { quoted: message });
      
    } catch (error) {
      console.error('Son command error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Failed to pick a son. Try again later.'
      }, { quoted: message });
    }
  }
};
