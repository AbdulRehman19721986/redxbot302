const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { commands } = require('./command');

// Load all plugins
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach(file => {
        if (file.endsWith('.js')) {
            require(path.join(pluginsDir, file));
        }
    });
    console.log(`✅ Loaded ${commands.length} commands.`);
} else {
    console.warn('⚠️ Plugins folder not found. No commands loaded.');
}

async function startBot() {
    // Attempt to download session from MEGA if SESSION_ID exists
    let creds = null;
    if (config.SESSION_ID) {
        creds = await config.loadSessionFromMega(config.SESSION_ID);
    }

    const { state, saveCreds } = await useMultiFileAuthState('./sessions', {
        creds: creds || undefined
    });

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        printQRInTerminal: !creds, // only show QR if no session loaded
        logger: pino({ level: 'silent' }),
        browser: ['REDXBOT302', 'Safari', '1.0.0'],
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && !creds) {
            console.log('📱 QR Code generated. Scan with WhatsApp.');
        }
        if (connection === 'open') {
            console.log('✅ Bot connected to WhatsApp!');
            // Send startup message to owner
            const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, { text: `*${config.BOT_NAME} is now online!*\n\nPrefix: ${config.PREFIX}\nMode: ${config.MODE}` });
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error).output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Delete sessions folder and restart.');
                process.exit(1);
            } else {
                console.log('🔁 Reconnecting...');
                startBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        const messageType = Object.keys(m.message)[0];
        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.imageMessage?.caption || m.message.extendedTextMessage?.text || '';

        // Ignore own messages and status broadcasts
        if (m.key.fromMe || from === 'status@broadcast') return;

        // Check prefix
        if (!body.startsWith(config.PREFIX)) return;
        const args = body.slice(config.PREFIX.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const cmd = commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
        if (cmd) {
            try {
                await cmd.function(sock, m, from, args, config);
            } catch (err) {
                console.error('Command error:', err);
                await sock.sendMessage(from, { text: '❌ An error occurred while executing the command.' });
            }
        }
    });
}

startBot();

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
