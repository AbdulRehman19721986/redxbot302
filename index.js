/**
 * REDXBOT – WhatsApp Bot
 * Owner: Abdul Rehman Rajpoot
 * Version: 2.0.0
 * 
 * Connects using a SESSION_ID from MEGA (downloaded automatically).
 * Environment variables:
 *   SESSION_ID – MEGA file ID (e.g., abc123#key) – required
 *   BOT_NAME – bot display name (default: REDXBOT)
 *   PREFIX – command prefix (default: !)
 *   OWNER_NAME – your name (default: Abdul Rehman Rajpoot)
 *   OWNER_NUMBER – your WhatsApp number (for welcome message)
 */

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { File } from 'megajs'; // for MEGA download

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION (from environment) ====================
const SESSION_ID = process.env.SESSION_ID || '';
const BOT_NAME = process.env.BOT_NAME || 'REDXBOT';
const PREFIX = process.env.PREFIX || '!';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const OWNER_NUMBER = process.env.OWNER_NUMBER || ''; // optional, for welcome DM

if (!SESSION_ID) {
  console.error('❌ SESSION_ID environment variable is required.');
  process.exit(1);
}

// ==================== LOGGER (simple console) ====================
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

// ==================== COMMAND REGISTRY ====================
const commands = new Map();

function registerCommand(name, description, execute) {
  commands.set(name, { description, execute });
}

// ----- built‑in commands -----
registerCommand('ping', 'Check bot response time.', async (sock, from, args) => {
  const start = Date.now();
  await sock.sendMessage(from, { text: 'Pong! 🏓' });
  const latency = Date.now() - start;
  await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
});

registerCommand('menu', 'Show all commands.', async (sock, from, args) => {
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

registerCommand('test', 'Test if bot is working.', async (sock, from, args) => {
  await sock.sendMessage(from, { text: '✅ Bot is working!' });
});

registerCommand('hi', 'Say hello.', async (sock, from, args) => {
  await sock.sendMessage(from, { text: `Hello! 👋 I am ${BOT_NAME}.` });
});

// Add more commands as needed...

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

  if (!text.startsWith(PREFIX)) return;
  logger.info(`Received command from ${from}: ${text}`);
  const [cmdName, ...args] = text.slice(PREFIX.length).trim().split(' ');
  const command = commands.get(cmdName.toLowerCase());
  if (command) {
    try {
      await command.execute(sock, from, args);
      logger.info(`Command executed: ${cmdName}`);
    } catch (err) {
      logger.error(`Command error (${cmdName}):`, err);
      await sock.sendMessage(from, { text: '❌ An error occurred while executing the command.' });
    }
  }
}

// ----- connection.update (connect, disconnect) -----
async function handleConnectionUpdate(sock, update, startBot) {
  const { connection, lastDisconnect, qr } = update;
  // We ignore QR because we use session ID
  if (qr) return;

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
    // Send welcome message to owner if number provided
    if (OWNER_NUMBER) {
      try {
        const ownerJid = OWNER_NUMBER + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, {
          text: `✅ *${BOT_NAME} is now online!*\n\nOwner: ${OWNER_NAME}\nPrefix: ${PREFIX}\n\nThank you for using ${BOT_NAME}!`
        });
        logger.info('📨 Welcome message sent to owner.');
      } catch (err) {
        logger.error('Failed to send welcome message:', err);
      }
    }
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
let cachedCreds = null; // store downloaded session

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  if (currentSocket) {
    currentSocket.ev.removeAllListeners();
    await currentSocket.end().catch(() => {});
    currentSocket = null;
  }
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  // Download session from MEGA only once
  if (!cachedCreds) {
    cachedCreds = await loadSessionFromMega(SESSION_ID);
  }

  const { state, saveCreds } = await useMultiFileAuthState('./sessions', {
    creds: cachedCreds || undefined
  });

  const { version } = await fetchLatestBaileysVersion();

  // Use pino for key store logger (minimal)
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

// Helper delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the bot
startBot().catch(err => logger.error('Fatal error:', err));

process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
