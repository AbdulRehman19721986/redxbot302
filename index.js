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

// -------- Ensure plugins folder exists and load plugins --------
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
    console.log('📁 Created plugins folder.');
}

let pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

if (pluginFiles.length === 0) {
    console.log('⚠️ No plugin files found. Creating default plugin.');
    const defaultPlugin = `import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: 'test',
    desc: 'Test command',
    category: 'utility',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '✅ Test command works!' });
});
`;
    fs.writeFileSync(path.join(pluginsDir, 'main.js'), defaultPlugin);
    console.log('📝 Created default plugin: main.js');
    pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
}

console.log(`📁 Found ${pluginFiles.length} plugin files.`);
for (const file of pluginFiles) {
    console.log(`📦 Loading plugin: ${file}`);
    await import(path.join(pluginsDir, file));
}
console.log(`✅ Loaded ${commands.length} commands.`);

// -------- Global variables --------
let cachedCreds = null;
let currentSocket = null;
let reconnectTimeout = null;
let isConnecting = false;

async function startBot() {
    if (isConnecting) {
        console.log('⏳ Already connecting, waiting...');
        return;
    }
    isConnecting = true;

    if (currentSocket) {
        console.log('🧹 Closing previous socket...');
        currentSocket.ev.removeAllListeners();
        await currentSocket.end().catch(() => {});
        currentSocket = null;
    }

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (!cachedCreds && config.SESSION_ID) {
        cachedCreds = await config.loadSessionFromMega(config.SESSION_ID);
    }

    const { state, saveCreds } = await useMultiFileAuthState('./sessions', {
        creds: cachedCreds || undefined
    });

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        printQRInTerminal: !cachedCreds,
        logger: pino({ level: 'silent' }),
        browser: ['REDXBOT302', 'Safari', '1.0.0'],
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        defaultQueryTimeoutMs: 60000,
        syncFullHistory: true,
        getMessage: async () => undefined,
    });

    currentSocket = sock;
    isConnecting = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !cachedCreds) {
            console.log('📱 QR Code generated. Scan with WhatsApp.');
        }

        if (connection === 'open') {
            console.log('✅ Bot connected to WhatsApp!');
            
            try {
                const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
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
                console.log('📨 Welcome message sent to owner.');
            } catch (err) {
                console.error('❌ Failed to send welcome message:', err);
            }
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
            console.log(`❌ Connection closed. Status code: ${statusCode}, Reason: ${errorMessage}`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Delete sessions folder and restart.');
                process.exit(1);
            } else {
                console.log('🔁 Reconnecting in 5 seconds...');
                reconnectTimeout = setTimeout(() => {
                    startBot().catch(err => console.error('Reconnect error:', err));
                }, 5000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // -------- Universal message handler with logging --------
    const handleMessage = async (m) => {
        if (!m || !m.message) {
            console.log('⚠️ Message has no .message field');
            return;
        }

        const from = m.key.remoteJid;
        if (m.key.fromMe || from === 'status@broadcast') {
            console.log('⏭️ Skipping own message or status broadcast');
            return;
        }

        // Extract text
        let body = '';
        if (m.message.conversation) {
            body = m.message.conversation;
        } else if (m.message.extendedTextMessage?.text) {
            body = m.message.extendedTextMessage.text;
        } else if (m.message.imageMessage?.caption) {
            body = m.message.imageMessage.caption;
        } else if (m.message.videoMessage?.caption) {
            body = m.message.videoMessage.caption;
        } else {
            console.log('📭 No extractable text in message');
            return;
        }

        console.log(`📩 Received from ${from}: "${body}"`);

        // Check prefix
        if (!body.startsWith(config.PREFIX)) {
            console.log(`⏭️ Message does not start with prefix "${config.PREFIX}"`);
            return;
        }

        const args = body.slice(config.PREFIX.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        console.log(`🔍 Looking for command: "${cmdName}"`);

        const command = commands.find(c => 
            c.pattern === cmdName || (c.alias && c.alias.includes(cmdName))
        );

        if (command) {
            console.log(`⚡ Executing command: ${cmdName}`);
            try {
                await command.function(sock, m, from, args, config);
                console.log(`✅ Command ${cmdName} executed successfully.`);
            } catch (err) {
                console.error(`❌ Command error for ${cmdName}:`, err);
                await sock.sendMessage(from, { text: '❌ An error occurred while executing the command.' });
            }
        } else {
            console.log(`❓ Unknown command: ${cmdName}`);
        }
    };

    // Listen to all possible message events
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            await handleMessage(m);
        }
    });
    sock.ev.on('messages', async (messages) => {
        for (const m of messages) {
            await handleMessage(m);
        }
    });
    sock.ev.on('message', async (m) => {
        await handleMessage(m);
    });
}

startBot().catch(err => console.error('Fatal error:', err));

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
