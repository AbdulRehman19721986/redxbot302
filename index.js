import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from './config.js';
import { commands } from './command.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -------- Extract makeWASocket --------
let makeWASocket;
if (baileys.default && typeof baileys.default.makeWASocket === 'function') {
    makeWASocket = baileys.default.makeWASocket;
    console.log('✅ Using baileys.default.makeWASocket');
} else if (typeof baileys.makeWASocket === 'function') {
    makeWASocket = baileys.makeWASocket;
    console.log('✅ Using baileys.makeWASocket');
} else {
    console.error('❌ Could not find makeWASocket function. Exiting.');
    process.exit(1);
}

const useMultiFileAuthState = baileys.useMultiFileAuthState || baileys.default?.useMultiFileAuthState;
const DisconnectReason = baileys.DisconnectReason || baileys.default?.DisconnectReason;
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion || baileys.default?.fetchLatestBaileysVersion;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || baileys.default?.makeCacheableSignalKeyStore;

// -------- Load plugins --------
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

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
    pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
}

console.log(`📁 Found ${pluginFiles.length} plugin files.`);
for (const file of pluginFiles) {
    console.log(`📦 Loading plugin: ${file}`);
    await import(path.join(pluginsDir, file));
}
console.log(`✅ Loaded ${commands.length} commands.`);

// -------- Built-in test command --------
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
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

async function clearSessionFolder() {
    const sessionPath = path.join(__dirname, 'sessions');
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('🧹 Cleared session folder.');
    }
}

async function startBot() {
    if (isConnecting) return;
    isConnecting = true;

    if (currentSocket) {
        currentSocket.ev.removeAllListeners();
        await currentSocket.end().catch(() => {});
        currentSocket = null;
    }
    if (reconnectTimeout) clearTimeout(reconnectTimeout);

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
        
        if (qr && !cachedCreds) console.log('📱 QR Code generated. Scan with WhatsApp.');
        if (connection === 'open') {
            console.log('✅ Bot connected to WhatsApp!');
            reconnectAttempts = 0;
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
                console.log('❌ Logged out. Clearing session folder and exiting.');
                await clearSessionFolder();
                cachedCreds = null;
                process.exit(1);
            } else if (statusCode === 440) { // Conflict
                console.log(`
╔════════════════════════════════════════════════════════════╗
║                        ❗ CONFLICT ❗                        ║
╠════════════════════════════════════════════════════════════╣
║ Another device is using the same WhatsApp number.          ║
║ The bot cannot receive messages while another session      ║
║ is active.                                                 ║
╟────────────────────────────────────────────────────────────╢
║ ✅ FIX:                                                    ║
║ 1. Open WhatsApp on your phone.                            ║
║ 2. Go to Settings → Linked Devices.                        ║
║ 3. Log out from ALL devices (Web, Desktop, etc.).         ║
║ 4. Restart this bot.                                       ║
║                                                            ║
║ If the problem persists, generate a fresh SESSION_ID      ║
║ using a different phone number.                            ║
╚════════════════════════════════════════════════════════════╝`);
                await clearSessionFolder();
                cachedCreds = null;
                process.exit(1);
            } else {
                reconnectAttempts++;
                if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                    console.log('❌ Max reconnection attempts reached. Exiting.');
                    process.exit(1);
                }
                const delay = 5000 * reconnectAttempts;
                console.log(`🔁 Reconnecting in ${delay/1000}s... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                reconnectTimeout = setTimeout(() => startBot(), delay);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // -------- Message handler --------
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (!m.message) continue;
            const from = m.key.remoteJid;
            if (m.key.fromMe || from === 'status@broadcast') continue;

            let body = '';
            if (m.message.conversation) body = m.message.conversation;
            else if (m.message.extendedTextMessage?.text) body = m.message.extendedTextMessage.text;
            else if (m.message.imageMessage?.caption) body = m.message.imageMessage.caption;
            else if (m.message.videoMessage?.caption) body = m.message.videoMessage.caption;
            else continue;

            console.log(`📩 Received: "${body}"`);

            // Direct ping for testing
            if (body.toLowerCase() === 'ping') {
                await sock.sendMessage(from, { text: '🏓 Pong! (direct)' });
                continue;
            }

            if (!body.startsWith(config.PREFIX)) continue;

            const args = body.slice(config.PREFIX.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();

            const command = commands.find(c => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)));
            if (command) {
                try {
                    await command.function(sock, m, from, args, config);
                } catch (err) {
                    console.error('❌ Command error:', err);
                    await sock.sendMessage(from, { text: '❌ Command error.' });
                }
            } else {
                await sock.sendMessage(from, { text: `❌ Unknown command. Use ${config.PREFIX}menu` });
            }
        }
    });
}

startBot().catch(err => console.error('Fatal error:', err));

process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));
