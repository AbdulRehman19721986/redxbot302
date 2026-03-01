module.exports = {
  command: 'mute',
  aliases: ['silence'],
  category: 'admin',
  description: 'Mute the group for a specified duration',
  usage: '.mute [duration in minutes]',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const durationInMinutes = args[0] ? parseInt(args[0]) : undefined;

    try {
      await sock.groupSettingUpdate(chatId, 'announcement');
      
      if (durationInMinutes !== undefined && durationInMinutes > 0) {
        await sock.sendMessage(chatId, { 
          text: `🔇 Group muted for ${durationInMinutes} minutes.`
        }, { quoted: message });
        
        setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, { 
              text: '🔊 Group unmuted.'
            });
          } catch (unmuteError) {
            console.error('Error unmuting group:', unmuteError);
          }
        }, durationInMinutes * 60 * 1000);
      } else {
        await sock.sendMessage(chatId, { 
          text: '🔇 Group muted.'
        }, { quoted: message });
      }
    } catch (error) {
      console.error('Error muting group:', error);
      await sock.sendMessage(chatId, { 
        text: '❌ An error occurred while muting the group. Please try again.'
      }, { quoted: message });
    }
  }
};
