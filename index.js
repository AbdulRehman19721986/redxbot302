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
    const defaultPlugin = `import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: 'ping',
    desc: 'Ping command',
    category: 'utility',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: 'Pong!' });
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

// -------- Add a built-in test command (always available) --------
import { cmd } from './command.js';
cmd({
    pattern: 'test',
    desc: 'Test if bot is working',
    category: 'debug',
    filename: 'builtin'
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '✅ Bot is working! Commands are active.' });
});
console.log('🔧 Built-in test command added.');

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

    // -------- Message Handler with Full Debugging --------
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) {
            console.log('⚠️ Message has no .message field');
            return;
        }

        const from = m.key.remoteJid;
        // Log EVERY message received
        console.log('📥 New message from:', from);
        console.log('📄 Message key:', JSON.stringify(m.key, null, 2));
        console.log('📄 Message types:', Object.keys(m.message));
        
        // Skip own messages
        if (m.key.fromMe) {
            console.log('⏭️ Skipping own message.');
            return;
        }
        // Skip status broadcasts
        if (from === 'status@broadcast') {
            console.log('⏭️ Skipping status broadcast.');
            return;
        }

        // Extract text from all possible fields
        let body = '';
        if (m.message.conversation) {
            body = m.message.conversation;
        } else if (m.message.extendedTextMessage?.text) {
            body = m.message.extendedTextMessage.text;
        } else if (m.message.imageMessage?.caption) {
            body = m.message.imageMessage.caption;
        } else if (m.message.videoMessage?.caption) {
            body = m.message.videoMessage.caption;
        } else if (m.message.documentMessage?.caption) {
            body = m.message.documentMessage.caption;
        } else if (m.message.buttonsResponseMessage?.selectedButtonId) {
            body = m.message.buttonsResponseMessage.selectedButtonId;
        } else if (m.message.listResponseMessage?.singleSelectReply?.selectedRowId) {
            body = m.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (m.message.ephemeralMessage?.message?.conversation) {
            body = m.message.ephemeralMessage.message.conversation;
        } else if (m.message.ephemeralMessage?.message?.extendedTextMessage?.text) {
            body = m.message.ephemeralMessage.message.extendedTextMessage.text;
        }

        if (!body) {
            console.log('📭 No extractable text in this message.');
            return;
        }

        console.log(`📩 Extracted body: "${body}"`);

        // Check if message starts with prefix
        if (!body.startsWith(config.PREFIX)) {
            console.log(`⏭️ Message does not start with prefix "${config.PREFIX}".`);
            // For debugging, if message is "ping" without prefix, respond
            if (body.toLowerCase() === 'ping') {
                console.log('⚡ Responding to raw "ping" for testing.');
                await sock.sendMessage(from, { text: 'Pong! (raw ping)' });
            }
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
    });
}

startBot().catch(err => console.error('Fatal error:', err));

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
