import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from './config.js';
import { commands } from './command.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -------- Safely extract makeWASocket --------
let makeWASocket;
if (typeof baileys.default === 'function') {
    makeWASocket = baileys.default;
} else if (typeof baileys.makeWASocket === 'function') {
    makeWASocket = baileys.makeWASocket;
} else if (typeof baileys === 'function') {
    makeWASocket = baileys;
} else if (baileys.default && typeof baileys.default.default === 'function') {
    makeWASocket = baileys.default.default;
} else {
    console.error('❌ Could not find makeWASocket function. Exports:', Object.keys(baileys));
    process.exit(1);
}

const useMultiFileAuthState = baileys.useMultiFileAuthState || baileys.default?.useMultiFileAuthState;
const DisconnectReason = baileys.DisconnectReason || baileys.default?.DisconnectReason;
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion || baileys.default?.fetchLatestBaileysVersion;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || baileys.default?.makeCacheableSignalKeyStore;

// -------- Load plugins --------
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
            
            // Enhanced professional welcome message
            const welcomeMessage = `╔══════════════════════╗
║   🔥 *REDXBOT302* 🔥   ║
╚══════════════════════╝

✅ *Bot is now online!*

📌 *Prefix:* ${config.PREFIX}
👑 *Owner:* ${config.OWNER_NAME}
👤 *Mode:* ${config.MODE}

🔗 *Important Links:*
• GitHub: https://github.com/AbdulRehman19721986/REDXBOT-MD
• WhatsApp Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10
• Telegram Group: https://t.me/TeamRedxhacker2
• YouTube: https://youtube.com/@rootmindtech

✨ *Thank you for using REDXBOT!* ✨`;

            await sock.sendMessage(ownerJid, { text: welcomeMessage });
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
