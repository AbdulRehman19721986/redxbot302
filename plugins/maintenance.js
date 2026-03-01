/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot & Muzamil Khan                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/AbdulRehman19721986                         *
 *  ▶️  YouTube  : https://youtube.com/@AbdulRehman19721986                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10     *
 *                                                                           *
 *    © 2026 AbdulRehman19721986. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the REDXBOT302 Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/


const CommandHandler = require('../lib/commandHandler');

let activeMaintenanceTimer = null;

module.exports = {
  command: 'maintenance',
  aliases: ['mtnc', 'lockdown'],
  category: 'owner',
  description: 'Disable non-owner commands for a duration or stop it early',
  usage: '.maintenance [minutes / stop]',
  ownerOnly: 'true',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    const input = args[0]?.toLowerCase();

    if (input === 'stop' || input === 'off') {
      if (activeMaintenanceTimer) {
        clearTimeout(activeMaintenanceTimer);
        activeMaintenanceTimer = null;
      }
      
      const allCommands = Array.from(CommandHandler.commands.values());
      allCommands.forEach(cmd => {
        if (cmd.category !== 'owner') {
          CommandHandler.disabledCommands.delete(cmd.command.toLowerCase());
        }
      });

      return await sock.sendMessage(chatId, { text: '✅ *MAINTENANCE ENDED EARLY*\nAll commands are now active.' }, { quoted: message });
    }
    
    const minutes = parseInt(input);
    if (isNaN(minutes) || minutes <= 0) {
      return await sock.sendMessage(chatId, { text: '❌ Usage: .maintenance [minutes] OR .maintenance stop' }, { quoted: message });
    }

    try {
      if (activeMaintenanceTimer) clearTimeout(activeMaintenanceTimer);

      const allCommands = Array.from(CommandHandler.commands.values());
      let affectedCount = 0;

      allCommands.forEach(cmd => {
        if (cmd.category !== 'owner' && cmd.command !== 'maintenance') {
          const key = cmd.command.toLowerCase();
          if (!CommandHandler.disabledCommands.has(key)) {
            CommandHandler.disabledCommands.add(key);
            affectedCount++;
          }
        }
      });

      await sock.sendMessage(chatId, { 
        text: `⚠️ *MAINTENANCE MODE STARTING*\n\n` +
              `Locked: ${affectedCount} commands\n` +
              `Duration: ${minutes}m\n\n` +
              `_Type ".maintenance stop" to enable commands early._`
      }, { quoted: message });

      activeMaintenanceTimer = setTimeout(async () => {
        allCommands.forEach(cmd => {
          if (cmd.category !== 'owner') {
            CommandHandler.disabledCommands.delete(cmd.command.toLowerCase());
          }
        });
        activeMaintenanceTimer = null;
        await sock.sendMessage(chatId, { text: '✅ *MAINTENANCE FINISHED*\nCommands re-enabled automatically.' });
      }, minutes * 60000);

    } catch (error) {
      console.error('Maintenance Error:', error);
      await sock.sendMessage(chatId, { text: '❌ Action failed.' }, { quoted: message });
    }
  }
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot & Muzamil Khan                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/AbdulRehman19721986                         *
 *  ▶️  YouTube  : https://youtube.com/@AbdulRehman19721986                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10     *
 *                                                                           *
 *    © 2026 AbdulRehman19721986. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the REDXBOT302 Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/

