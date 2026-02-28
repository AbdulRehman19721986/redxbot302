import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import ytSearch from 'yt-search';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { File } from 'megajs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION (from environment variables) ====================
const config = {
    SESSION_ID: process.env.SESSION_ID || "",
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY REDXBOT302 🤍*",
    ANTI_DELETE: process.env.ANTI_DELETE || "true",
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox",
    WELCOME: process.env.WELCOME || "false",
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",
    ANTI_LINK: process.env.ANTI_LINK || "true",
    MENTION_REPLY: process.env.MENTION_REPLY || "false",
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://image2url.com/r2/default/images/1772252008593-2690797c-4bd7-431e-b1f7-0f6ea21f7320.jpg",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "REDXBOT302",
    STICKER_NAME: process.env.STICKER_NAME || "redx bot",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    DELETE_LINKS: process.env.DELETE_LINKS || "false",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "61468259338",
    OWNER_NAME: process.env.OWNER_NAME || "Abdul Rehman Rajpoot",
    DESCRIPTION: process.env.DESCRIPTION || "*© CREATED BY Abdul Rehman Rajpoot *",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://image2url.com/r2/default/images/1772252008593-2690797c-4bd7-431e-b1f7-0f6ea21f7320.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> HEY IM ALIVE NOW *REDXBOT302*⚡",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    ANTI_BAD: process.env.ANTI_BAD || "false",
    MODE: process.env.MODE || "public",
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    AUTO_TYPING: process.env.AUTO_TYPING || "true",
    READ_CMD: process.env.READ_CMD || "false",
    DEV: process.env.DEV || "61468259338",
    ANTI_VV: process.env.ANTI_VV || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
};

// ==================== MEGA SESSION DOWNLOADER ====================
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

function cmd(info, func) {
    const data = info;
    data.function = func;
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    commands.push(data);
    return data;
}

// ==================== HELPER FUNCTIONS ====================
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + (s ? s + 's' : '');
}

// ==================== DEFINE COMMANDS ====================

// --- test command ---
cmd({
    pattern: 'test',
    desc: 'Test if bot is working',
    category: 'debug',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '✅ Bot is working! Commands are active.' });
});

// --- ping commands (ping0..ping99) ---
for (let i = 0; i < 100; i++) {
    cmd({
        pattern: `ping${i}`,
        desc: `Test command ${i}`,
        category: 'test',
        filename: 'builtin'
    }, async (conn, mek, from, args, config) => {
        await conn.sendMessage(from, { text: `Pong ${i}!` });
    });
}

// --- ping (simple) ---
cmd({
    pattern: 'ping',
    desc: 'Simple ping command',
    category: 'utility',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: 'Pong!' });
});

// --- menu command (beautiful) ---
cmd({
    pattern: 'menu',
    desc: 'Show bot menu',
    category: 'main',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    const categories = {};
    commands.forEach(cmd => {
        if (!categories[cmd.category]) categories[cmd.category] = [];
        categories[cmd.category].push(cmd.pattern);
    });
    const uptime = process.uptime();
    const runtimeStr = runtime(uptime);

    let menuText = `╭┈───〔 *${config.BOT_NAME}* 〕┈───⊷\n`;
    menuText += `├▢ 🇵🇸 Owner: ${config.OWNER_NAME}\n`;
    menuText += `├▢ 🪄 Prefix: ${config.PREFIX}\n`;
    menuText += `├▢ 🎐 Version: 4.5.0\n`;
    menuText += `├▢ ☁️ Platform: Railway\n`;
    menuText += `├▢ 📜 Plugins: ${commands.length}\n`;
    menuText += `├▢ ⏰ Runtime: ${runtimeStr}\n`;
    menuText += `╰───────────────────⊷\n`;
    menuText += `╭───⬡ *SELECT MENU* ⬡───\n`;

    const sortedCategories = Object.keys(categories).sort();
    sortedCategories.forEach((cat, index) => {
        menuText += `┋ ⬡ ${index+1} ${cat.toUpperCase()} MENU\n`;
    });
    menuText += `╰───────────────────⊷\n`;
    menuText += `\n🔗 *Important Links:*\n`;
    menuText += `• GitHub: https://github.com/AbdulRehman19721986/REDXBOT-MD\n`;
    menuText += `• WhatsApp Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10\n`;
    menuText += `• Telegram: https://t.me/TeamRedxhacker2\n`;
    menuText += `• YouTube: https://youtube.com/@rootmindtech\n`;
    menuText += `\n✨ *Thank you for using REDXBOT!* ✨`;

    await conn.sendMessage(from, { text: menuText });
});

// --- owner command ---
cmd({
    pattern: 'owner',
    desc: 'Show owner contact',
    category: 'info',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + config.OWNER_NAME + '\nTEL;waid=' + config.OWNER_NUMBER + ':+' + config.OWNER_NUMBER + '\nEND:VCARD';
    await conn.sendMessage(from, {
        contacts: {
            displayName: config.OWNER_NAME,
            contacts: [{ vcard }]
        }
    });
});

// --- alive command ---
cmd({
    pattern: 'alive',
    desc: 'Check bot status',
    category: 'main',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: config.LIVE_MSG || 'I am alive!' });
});

// --- play command (YouTube audio) ---
cmd({
    pattern: 'play',
    desc: 'Download audio from YouTube',
    category: 'downloader',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a song name.' });
    const query = args.join(' ');
    try {
        const { videos } = await ytSearch(query);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results found.' });
        const video = videos[0];
        const url = video.url;
        await conn.sendMessage(from, { text: `🎵 *Title:* ${video.title}\n📎 *Link:* ${url}\n⏱️ *Duration:* ${video.timestamp}` });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Error fetching video.' });
    }
});

// --- video command (YouTube video) ---
cmd({
    pattern: 'video',
    desc: 'Download video from YouTube',
    category: 'downloader',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a video name.' });
    const query = args.join(' ');
    try {
        const { videos } = await ytSearch(query);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results found.' });
        const video = videos[0];
        const url = video.url;
        await conn.sendMessage(from, { text: `🎬 *Title:* ${video.title}\n📎 *Link:* ${url}\n⏱️ *Duration:* ${video.timestamp}` });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Error fetching video.' });
    }
});

// --- ai command (GPT chat) ---
cmd({
    pattern: 'ai',
    desc: 'Chat with AI',
    category: 'ai',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a message.' });
    const prompt = args.join(' ');
    try {
        const { data } = await axios.get(`https://api.akuari.my.id/ai/gpt?text=${encodeURIComponent(prompt)}`);
        const reply = data.respon || data.message || 'No response';
        await conn.sendMessage(from, { text: reply });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ AI service unavailable.' });
    }
});

// --- sticker command ---
cmd({
    pattern: 'sticker',
    alias: ['s'],
    desc: 'Create sticker from image/video',
    category: 'tools',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage && !mek.message.videoMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to an image or video with caption .sticker' });
    }
    let stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    try {
        const sticker = new Sticker(buffer, {
            pack: config.STICKER_NAME || 'REDXBOT',
            author: config.BOT_NAME || 'REDXBOT',
            type: StickerTypes.FULL,
            quality: 80
        });
        const stickerBuffer = await sticker.toBuffer();
        await conn.sendMessage(from, { sticker: stickerBuffer });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Failed to create sticker.' });
    }
});

// --- setpp command (change profile picture) ---
cmd({
    pattern: 'setpp',
    desc: 'Change bot profile picture',
    category: 'owner',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    const sender = mek.key.participant || mek.key.remoteJid;
    if (sender !== config.OWNER_NUMBER + '@s.whatsapp.net') {
        return await conn.sendMessage(from, { text: '❌ Only owner can use this command.' });
    }
    if (!mek.message.imageMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to an image.' });
    }
    let stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    try {
        await conn.updateProfilePicture(conn.user.id, buffer);
        await conn.sendMessage(from, { text: '✅ Profile picture updated.' });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Failed to update profile picture.' });
    }
});

// --- features command ---
cmd({
    pattern: 'features',
    desc: 'Show bot features',
    category: 'info',
    filename: 'builtin'
}, async (conn, mek, from, args, config) => {
    const features = `╔════════════════════════╗
║   ⚒️ *BOT FEATURES* ⚒️   ║
╚════════════════════════╝

🤖 *Ultimate Work* ➜ ✅ Active
🔁 *Anti-Delete* ➜ ✅ Active
🎵 *24/7 Runtime* ➜ ✅ Active
📥 *Downloader* ➜ ✅ Active
🧠 *AI Chat* ➜ ✅ Active
👮 *Group Setting* ➜ ✅ Active
📛 *Auto Sticker* ➜ ✅ Active
🎮 *Games* ➜ ✅ Active
🌐 *Web Pairing* ➜ ✅ Active
🎨 *Sticker Maker* ➜ ✅ Active

✨ *And many more...* ✨`;
    await conn.sendMessage(from, { text: features });
});

// --- more commands can be added here following the same pattern ---

// ==================== BAILES SETUP ====================
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

// ==================== GLOBAL VARIABLES ====================
let cachedCreds = null;
let currentSocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

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
            reconnectAttempts = 0;
            
            // Send welcome message to owner
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
            } else if (statusCode === 440) {
                console.log(`
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
❌ CONFLICT DETECTED (Status 440)
   Another device is using the same WhatsApp number.
   The bot cannot receive messages while another session is active.

✅ SOLUTION:
   1. Open WhatsApp on your phone.
   2. Go to Settings → Linked Devices.
   3. Log out from ALL devices (Web, Desktop, etc.).
   4. Restart the bot.

   If you cannot log out, generate a new SESSION_ID with a different phone number.
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️`);
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

            console.log(`📩 Received from ${from}: "${body}"`);

            // Direct ping for testing (no prefix)
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

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
