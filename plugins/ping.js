module.exports = {
  command: 'ping',
  aliases: ['p', 'pong'],
  category: 'general',
  description: 'Check bot response time',
  usage: '.ping',
  isPrefixless: true,
  
  async handler(sock, message, args, context) {
    const start = Date.now();
    const chatId = message.key.remoteJid;
    
    // Send initial "Pinging..." message
    const sent = await sock.sendMessage(chatId, { text: '⚡ Pinging...' });
    
    // Calculate latency (includes time to send the first message)
    const latency = Date.now() - start;
    
    // Send the result as a new message, quoting the original command
    await sock.sendMessage(chatId, {
      text: `🏓 *Pong!*\n⏱️ Latency: *${latency}ms*`
    }, { quoted: message });
    
    // Optional: delete the "Pinging..." message (you can uncomment if desired)
    // await sock.sendMessage(chatId, { delete: sent.key });
  }
};
