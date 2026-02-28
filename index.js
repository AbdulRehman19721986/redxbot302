import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from './config.js';
import { commands } from './command.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Handle different export patterns of baileys
const makeWASocket = baileys.default || baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys;

// Load all plugins
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        await import(path.join(pluginsDir, file));
    }
    console.log(`✅ Loaded ${commands.length} commands.`);
} else {
    console.warn('⚠️ Plugins folder not found. No commands loaded.');
}

async function startBot() {
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
        printQRInTerminal: !creds,
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

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        let body = '';
        if (m.message.conversation) body = m.message.conversation;
        else if (m.message.imageMessage?.caption) body = m.message.imageMessage.caption;
        else if (m.message.extendedTextMessage?.text) body = m.message.extendedTextMessage.text;
        else return;

        if (m.key.fromMe || from === 'status@broadcast') return;

        if (!body.startsWith(config.PREFIX)) return;
        const args = body.slice(config.PREFIX.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const command = commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
        if (command) {
            try {
                await command.function(sock, m, from, args, config);
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
