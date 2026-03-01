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


module.exports = {
  command: 'uptime',
  aliases: ['runtime'],
  category: 'general',
  description: 'Show bot status information',
  usage: '.uptime',
  isPrefixless: true,

  async handler(sock, message) {
    const chatId = message.key.remoteJid;
    const commandHandler = require('../lib/commandHandler');
    const uptimeMs = process.uptime() * 1000;

    const formatUptime = (ms) => {
      const sec = Math.floor(ms / 1000) % 60;
      const min = Math.floor(ms / (1000 * 60)) % 60;
      const hr  = Math.floor(ms / (1000 * 60 * 60)) % 24;
      const day = Math.floor(ms / (1000 * 60 * 60 * 24));

      let parts = [];
      if (day) parts.push(`${day}d`);
      if (hr) parts.push(`${hr}h`);
      if (min) parts.push(`${min}m`);
      parts.push(`${sec}s`);

      return parts.join(' ');
    };
    
    const startedAt = new Date(Date.now() - uptimeMs).toLocaleString();
    const ramMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const commandCount = commandHandler.commands.size;

    const text =
      `🤖 *REDXBOT302 STATUS*\n\n` +
      `⏱ Uptime: ${formatUptime(uptimeMs)}\n` +
      `🚀 Started: ${startedAt}\n` +
      `📦 Plugins: ${commandCount}\n` +
      `💾 RAM: ${ramMb} MB`;

    await sock.sendMessage(chatId, { text });
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
