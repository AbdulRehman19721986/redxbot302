const settings = require('../settings');

module.exports = {
    command: 'pair',
    aliases: ['paircode', 'connect'],
    category: 'info',
    description: 'Get a pairing code to connect your WhatsApp',
    usage: '.pair <phone number>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        // Check if already registered
        if (sock.authState?.creds?.registered) {
            return await sock.sendMessage(chatId, { 
                text: `✅ *Your WhatsApp is already connected!*\n\nBot is ready to use.` 
            }, { quoted: message });
        }

        // Get phone number
        let phoneNumber = args[0];
        if (!phoneNumber) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted) {
                phoneNumber = quoted.conversation || quoted.extendedTextMessage?.text;
            }
        }
        if (!phoneNumber) {
            return await sock.sendMessage(chatId, { 
                text: `❌ Please provide your phone number.\nExample: .pair 61468259338` 
            }, { quoted: message });
        }

        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (phoneNumber.length < 10) {
            return await sock.sendMessage(chatId, { text: '❌ Invalid phone number. Include country code.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: '⏳ Requesting pairing code...' }, { quoted: message });

        try {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code;

            const reply = `🔑 *Your Pairing Code*\n\n` +
                `\`\`\`${code}\`\`\`\n\n` +
                `1. Open WhatsApp on your phone.\n` +
                `2. Go to *Settings* → *Linked Devices* → *Link a Device*.\n` +
                `3. Enter this code.\n\n` +
                `👑 *Owner:* ${settings.botOwner} & ${settings.secondOwner}\n` +
                `🔗 *Channel:* ${settings.channelLink}\n` +
                `📢 *Group:* ${settings.whatsappGroup}`;

            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
        } catch (error) {
            console.error('Pairing error:', error);
            await sock.sendMessage(chatId, { 
                text: '❌ Failed to generate pairing code. Please try again later.' 
            }, { quoted: message });
        }
    }
};
