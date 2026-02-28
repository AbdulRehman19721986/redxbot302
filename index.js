/**
 * REDXBOT – WhatsApp Bot
 * Owner: Abdul Rehman Rajpoot
 * Version: 3.0.0
 * 
 * Features:
 * - Downloads session from MEGA using SESSION_ID
 * - Sends a heavy, professional welcome message with owner info and links
 * - Responds to .ping and ping (with and without prefix)
 * - Includes a test command
 */

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { File } from 'megajs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION (from environment) ====================
const SESSION_ID = process.env.SESSION_ID || '';
const BOT_NAME = process.env.BOT_NAME || 'REDXBOT';
const PREFIX = process.env.PREFIX || '.';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const OWNER_NUMBER = process.env.OWNER_NUMBER || ''; // WhatsApp number of the owner (for welcome DM)
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/AbdulRehman19721986/REDXBOT-MD';
const WHATSAPP_GROUP = process.env.WHATSAPP_GROUP || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo';
const WHATSAPP_CHANNEL = process.env.WHATSAPP_CHANNEL || 'https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10';
const TELEGRAM_LINK = process.env.TELEGRAM_LINK || 'https://t.me/TeamRedxhacker2';
const YOUTUBE_LINK = process.env.YOUTUBE_LINK || 'https://youtube.com/@rootmindtech';
const BOT_PIC_URL = process.env.BOT_PIC_URL || 'https://image2url.com/r2/default/images/1772252008593-2690797c-4bd7-431e-b1f7-0f6ea21f7320.jpg';

if (!SESSION_ID) {
  console.error('❌ SESSION_ID environment variable is required.');
  process.exit(1);
}

// ==================== LOGGER ====================
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

// ==================== MEGA SESSION DOWNLOADER ====================
async function loadSessionFromMega(sessionId) {
  const sessionDir = path.join(__dirname, 'sessions');
  const credsPath = path.join(sessionDir, 'creds.json');

  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  logger.info('[⏳] Downloading session from MEGA...');
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
    logger.info('[✅] Session downloaded successfully!');
    return JSON.parse(data.toString());
  } catch (err) {
    logger.error('[❌] Failed to download session:', err.message);
    return null;
  }
}

// ==================== COMMAND HANDLING ====================
const commands = new Map();

// Helper to register commands
function registerCommand(name, description, execute) {
  commands.set(name, { description, execute });
}

// ----- ping command (works with and without prefix) -----
// The message handler will check for prefix first; if not, it will still trigger on "ping"
registerCommand('ping', 'Check bot response time.', async (sock, from, args, msg) => {
  const start = Date.now();
  await sock.sendMessage(from, { text: 'Pong! 🏓' });
  const latency = Date.now() - start;
  await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
});

// ----- test command -----
registerCommand('test', 'Test if bot is working.', async (sock, from, args, msg) => {
  await sock.sendMessage(from, { text: '✅ Bot is working properly!' });
});

// ----- menu command (optional, but nice) -----
registerCommand('menu', 'Show all commands.', async (sock, from, args, msg) => {
  const cmdList = Array.from(commands.entries())
    .map(([name, cmd]) => `${PREFIX}${name} – ${cmd.description}`)
    .join('\n');
  const menuText = `
*${BOT_NAME} Commands*
Prefix: ${PREFIX}
${cmdList}
  `;
  await sock.sendMessage(from, { text: menuText });
});

// ==================== WELCOME MESSAGE (heavy, with image) ====================
async function sendWelcomeMessage(sock) {
  if (!OWNER_NUMBER) {
    logger.warn('OWNER_NUMBER not set – skipping welcome message.');
    return;
  }
  const ownerJid = OWNER_NUMBER + '@s.whatsapp.net';
  try {
    // First, fetch the image buffer
    const response = await fetch(BOT_PIC_URL);
    const buffer = await response.buffer();

    const welcomeText = `
╔══════════════════════╗
║   🔥 *${BOT_NAME}* 🔥   ║
╚══════════════════════╝

✅ *Bot is now online!*

📌 *Prefix:* ${PREFIX}
👑 *Owner:* ${OWNER_NAME}
👤 *Mode:* Public

🔗 *Important Links:*
• GitHub: ${GITHUB_URL}
• WhatsApp Channel: ${WHATSAPP_CHANNEL}
• WhatsApp Group: ${WHATSAPP_GROUP}
• Telegram: ${TELEGRAM_LINK}
• YouTube: ${YOUTUBE_LINK}

✨ *Thank you for using ${BOT_NAME}!* ✨
    `;

    await sock.sendMessage(ownerJid, {
      image: buffer,
      caption: welcomeText
    });
    logger.info('📨 Heavy welcome message sent to owner.');
  } catch (err) {
    logger.error('Failed to send welcome message:', err);
    // Fallback: send text only
    try {
      await sock.sendMessage(ownerJid, { text: welcomeText.replace(/[│╔╗╚╝]/g, '') });
    } catch (e) {}
  }
}

// ==================== EVENT HANDLERS ====================

// ----- messages.upsert (incoming messages) -----
async function handleMessagesUpsert(sock, { messages }) {
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;
  const from = msg.key.remoteJid;
  let text = '';
  if (msg.message.conversation) text = msg.message.conversation;
  else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
  else return;

  // Trim and lowercase for matching
  const trimmedText = text.trim().toLowerCase();

  // Handle direct "ping" without prefix
  if (trimmedText === 'ping') {
    logger.info(`Direct ping from ${from}`);
    const start = Date.now();
    await sock.sendMessage(from, { text: 'Pong! 🏓 (direct)' });
    const latency = Date.now() - start;
    await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
    return;
  }

  // Handle prefixed commands
  if (!text.startsWith(PREFIX)) return;
  const args = text.slice(PREFIX.length).trim().split(' ');
  const cmdName = args.shift().toLowerCase();
  logger.info(`Command received: ${cmdName} from ${from}`);

  const command = commands.get(cmdName);
  if (command) {
    try {
      await command.execute(sock, from, args, msg);
      logger.info(`✅ Command ${cmdName} executed.`);
    } catch (err) {
      logger.error(`❌ Command error (${cmdName}):`, err);
      await sock.sendMessage(from, { text: '❌ An error occurred while executing the command.' });
    }
  } else {
    await sock.sendMessage(from, { text: `❌ Unknown command. Use ${PREFIX}menu to see available commands.` });
  }
}

// ----- connection.update (connect, disconnect) -----
async function handleConnectionUpdate(sock, update, startBot) {
  const { connection, lastDisconnect } = update;

  if (connection === "close") {
    const reasonCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
    const shouldReconnect = reasonCode !== baileys.DisconnectReason.loggedOut;
    logger.warn(`Connection closed. Code: ${reasonCode}. Reconnecting? ${shouldReconnect}`);
    if (shouldReconnect) {
      await delay(5000);
      startBot();
    } else {
      logger.error("Logged out. Delete sessions folder and restart.");
    }
  } else if (connection === "open") {
    logger.info("✅ Bot connected to WhatsApp!");
    await sendWelcomeMessage(sock);
  }
}

// ==================== BAILIES SETUP ====================
let makeWASocket;
if (typeof baileys.default === 'function') {
  makeWASocket = baileys.default;
} else if (typeof baileys.makeWASocket === 'function') {
  makeWASocket = baileys.makeWASocket;
} else {
  console.error('❌ Could not find makeWASocket. Exiting.');
  process.exit(1);
}

const useMultiFileAuthState = baileys.useMultiFileAuthState || baileys.default?.useMultiFileAuthState;
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion || baileys.default?.fetchLatestBaileysVersion;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || baileys.default?.makeCacheableSignalKeyStore;
const DisconnectReason = baileys.DisconnectReason || baileys.default?.DisconnectReason;

// ==================== BOT LAUNCHER ====================
let currentSocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let cachedCreds = null;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  if (currentSocket) {
    currentSocket.ev.removeAllListeners();
    await currentSocket.end().catch(() => {});
    currentSocket = null;
  }
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  // Download session from MEGA (only once)
  if (!cachedCreds) {
    cachedCreds = await loadSessionFromMega(SESSION_ID);
  }

  const { state, saveCreds } = await useMultiFileAuthState('./sessions', {
    creds: cachedCreds || undefined
  });

  const { version } = await fetchLatestBaileysVersion();

  // Minimal pino logger for internal use
  const keyStoreLogger = pino({ level: 'fatal' });

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, keyStoreLogger),
    },
    printQRInTerminal: false, // no QR
    logger: pino({ level: 'silent' }),
    browser: [BOT_NAME, 'Safari', '1.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    shouldSyncHistoryMessage: false,
    getMessage: async () => undefined,
  });

  currentSocket = sock;
  isConnecting = false;

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => handleConnectionUpdate(sock, update, startBot));
  sock.ev.on('messages.upsert', (data) => handleMessagesUpsert(sock, data));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

startBot().catch(err => logger.error('Fatal error:', err));

process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
