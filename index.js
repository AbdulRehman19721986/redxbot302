import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { File } from 'megajs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIG ====================
const config = {
    SESSION_ID: process.env.SESSION_ID || "",
    PREFIX: process.env.PREFIX || ".",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "61468259338",
    OWNER_NAME: process.env.OWNER_NAME || "Abdul Rehman Rajpoot",
    BOT_NAME: process.env.BOT_NAME || "REDXBOT302",
    MODE: process.env.MODE || "public",
    LIVE_MSG: process.env.LIVE_MSG || "I am alive!",
    STICKER_NAME: process.env.STICKER_NAME || "redx bot",
};

// ==================== MEGA SESSION LOADER ====================
async function loadSessionFromMega(sessionId) {
    const sessionDir = path.join(__dirname, 'sessions');
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (!sessionId) {
        console.log('No SESSION_ID provided – will generate QR code.');
        return null;
    }
    console.log('[⏳] Downloading session from MEGA...');
    const megaFileId = sessionId.startsWith('IK~') ? sessionId.slice(3) : sessionId;
    const file = File.fromURL(`https://mega.nz/file/${megaFileId}`);
    try {
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        fs.writeFileSync(credsPath, data);
        console.log('[✅] Session downloaded successfully!');
        return JSON.parse(data.toString());
    } catch (err) {
        console.error('[❌] Failed to download session:', err.message);
        return null;
    }
}

// ==================== COMMAND REGISTRY ====================
const commands = [];

function cmd(pattern, desc, category, func) {
    commands.push({ pattern, desc, category, func });
}

// ----- Define commands -----
cmd('ping', 'Ping command', 'utility', async (conn, from, args) => {
    await conn.sendMessage(from, { text: 'Pong!' });
});

cmd('menu', 'Show menu', 'main', async (conn, from, args, config) => {
    let menu = `╭┈───〔 *${config.BOT_NAME}* 〕┈───⊷\n`;
    menu += `├▢ Owner: ${config.OWNER_NAME}\n`;
    menu += `├▢ Prefix: ${config.PREFIX}\n`;
    menu += `├▢ Mode: ${config.MODE}\n`;
    menu += `╰───────────────────⊷\n`;
    menu += `*Available Commands:*\n`;
    commands.forEach(cmd => {
        menu += `  ${config.PREFIX}${cmd.pattern} – ${cmd.desc}\n`;
    });
    menu += `\n✨ Thank you for using REDXBOT! ✨`;
    await conn.sendMessage(from, { text: menu });
});

cmd('test', 'Test command', 'debug', async (conn, from, args) => {
    await conn.sendMessage(from, { text: '✅ Test works!' });
});

// ==================== BAILES SETUP ====================
let makeWASocket;
if (baileys.default && typeof baileys.default.makeWASocket === 'function') {
    makeWASocket = baileys.default.makeWASocket;
} else if (typeof baileys.makeWASocket === 'function') {
    makeWASocket = baileys.makeWASocket;
} else {
    console.error('❌ Could not find makeWASocket. Exiting.');
    process.exit(1);
}

const useMultiFileAuthState = baileys.useMultiFileAuthState || baileys.default?.useMultiFileAuthState;
const DisconnectReason = baileys.DisconnectReason || baileys.default?.DisconnectReason;
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion || baileys.default?.fetchLatestBaileysVersion;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || baileys.default?.makeCacheableSignalKeyStore;

// ==================== GLOBALS ====================
let cachedCreds = null;
let currentSocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function clearSessionFolder() {
    const sessionPath = path.join(__dirname, 'sessions');
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
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
        cachedCreds = await loadSessionFromMega(config.SESSION_ID);
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
                await sock.sendMessage(ownerJid, { text: `✅ ${config.BOT_NAME} is now online!` });
            } catch (err) {
                console.error('❌ Failed to send welcome message:', err);
            }
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`❌ Connection closed. Status code: ${statusCode}`);
            if (statusCode === DisconnectReason.loggedOut) {
                await clearSessionFolder();
                cachedCreds = null;
                process.exit(1);
            } else if (statusCode === 440) {
                console.log('❌ Conflict detected. Please log out other devices.');
                await clearSessionFolder();
                cachedCreds = null;
                process.exit(1);
            } else {
                reconnectAttempts++;
                if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) process.exit(1);
                const delay = 5000 * reconnectAttempts;
                console.log(`🔁 Reconnecting in ${delay/1000}s...`);
                reconnectTimeout = setTimeout(startBot, delay);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ==================== MESSAGE HANDLER ====================
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

            console.log(`📩 Received from ${from}: "${body}"`);

            // Direct ping for testing
            if (body.toLowerCase() === 'ping') {
                await sock.sendMessage(from, { text: '🏓 Pong! (direct)' });
                continue;
            }

            if (!body.startsWith(config.PREFIX)) continue;

            const args = body.slice(config.PREFIX.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();

            const command = commands.find(c => c.pattern === cmdName);
            if (command) {
                console.log(`⚡ Executing command: ${cmdName}`);
                try {
                    await command.func(sock, from, args, config);
                } catch (err) {
                    console.error('❌ Command error:', err);
                    await sock.sendMessage(from, { text: '❌ Command error.' });
                }
            } else {
                console.log(`❓ Unknown command: ${cmdName}`);
            }
        }
    });
}

startBot().catch(err => console.error('Fatal error:', err));

process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));
