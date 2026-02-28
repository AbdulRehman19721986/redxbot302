/**
 * REDXBOT – WhatsApp Bot
 * Owner: Abdul Rehman Rajpoot
 * Version: 1.0.0
 */

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION (from environment) ====================
const BOT_NAME = process.env.BOT_NAME || 'REDXBOT';
const PREFIX = process.env.PREFIX || '!';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const OWNER_NUMBER = process.env.OWNER_NUMBER || ''; // optional, used for self‑DM
const SESSION_ID = process.env.SESSION_ID || ''; // optional, for MEGA session download (not used here)

// ==================== LOGGER (simple console) ====================
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

// ==================== COMMAND REGISTRY ====================
const commands = new Map();

// ----- hi command -----
commands.set('hi', {
  description: 'Say hello.',
  execute: async (sock, from, args) => {
    await sock.sendMessage(from, { text: `Hello! 👋 I am ${BOT_NAME}, your friendly bot.` });
  }
});

// ----- help command -----
commands.set('help', {
  description: 'List available commands.',
  execute: async (sock, from, args) => {
    const helpText = `
*${BOT_NAME} Commands*
Prefix: ${PREFIX}
${Array.from(commands.entries()).map(([name, cmd]) => `${PREFIX}${name} – ${cmd.description}`).join('\n')}
    `;
    await sock.sendMessage(from, { text: helpText });
  }
});

// ----- image command (placeholder) -----
commands.set('image', {
  description: 'Send an image.',
  execute: async (sock, from, args) => {
    await sock.sendMessage(from, {
      image: { url: 'https://www.nexoscreator.tech/logo.png' }, // replace with your own image
      caption: `Here is an image from ${BOT_NAME}!`
    });
  }
});

// ----- ping command -----
commands.set('ping', {
  description: 'Check bot response time.',
  execute: async (sock, from, args) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: 'Pong! 🏓' });
    const latency = Date.now() - start;
    await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
  }
});

// ----- poll command -----
commands.set('poll', {
  description: 'Create a poll. Usage: !poll Question? Option1; Option2; Option3',
  execute: async (sock, from, args) => {
    if (!args.length) {
      await sock.sendMessage(from, { text: "Usage: !poll Question? Option1; Option2; Option3" });
      return;
    }
    const input = args.join(" ").split("?");
    if (input.length < 2) {
      await sock.sendMessage(from, { text: "Please provide a question and at least two options." });
      return;
    }
    const question = input[0].trim() + "?";
    const options = input[1].split(";").map(opt => opt.trim()).filter(Boolean);
    if (options.length < 2) {
      await sock.sendMessage(from, { text: "Please provide at least two options separated by ';'." });
      return;
    }
    await sock.sendMessage(from, {
      poll: {
        name: question,
        values: options
      }
    });
  }
});

// ----- time command -----
commands.set('time', {
  description: 'Get the current server time.',
  execute: async (sock, from, args) => {
    const now = new Date().toLocaleString();
    await sock.sendMessage(from, { text: `Current server time: ${now}` });
  }
});

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
      logger.error(`Command error (${cmdName}): ${err}`);
    }
  }
}

// ----- connection.update (QR, connect, disconnect) -----
async function handleConnectionUpdate(sock, update, startBot) {
  const { connection, lastDisconnect, qr } = update;
  if (qr) {
    logger.info('QR code received – scan it with WhatsApp.');
    // QR is already printed to terminal by Baileys because we set printQRInTerminal: true
  }
  if (connection === "close") {
    const reasonCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
    const shouldReconnect = reasonCode !== baileys.DisconnectReason.loggedOut;
    logger.warn(`Connection closed. Code: ${reasonCode}. Reconnecting? ${shouldReconnect}`);
    if (shouldReconnect) {
      await delay(3000);
      startBot();
    } else {
      logger.error("Logged out. Please delete auth_info and re-authenticate.");
    }
  } else if (connection === "open") {
    logger.info("Connected to WhatsApp");
    // Send a welcome message to the bot's own chat (self-DM)
    try {
      const selfId = sock.user?.id || sock.user?.jid || sock.user;
      if (selfId) {
        await sock.sendMessage(selfId, {
          text: `✅ *${BOT_NAME} is now online!*\n\nOwner: ${OWNER_NAME}\nPrefix: ${PREFIX}\n\nThank you for using ${BOT_NAME}!`
        });
      } else {
        logger.warn("Could not determine bot's own WhatsApp ID for self-DM.");
      }
    } catch (err) {
      logger.error("Failed to send self-DM:", err);
    }
  }
}

// ----- other events (placeholder) -----
const eventHandlers = [
  { name: 'messages.upsert', handler: handleMessagesUpsert },
  // Add more events if needed
];

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

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  if (currentSocket) {
    currentSocket.ev.removeAllListeners();
    await currentSocket.end().catch(() => {});
    currentSocket = null;
  }
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  // Use pino for key store logger (minimal)
  const keyStoreLogger = pino({ level: 'fatal' }); // only fatal errors

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, keyStoreLogger),
    },
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }), // silent for socket logs
    browser: [BOT_NAME, 'Safari', '1.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    shouldSyncHistoryMessage: false,
    getMessage: async () => undefined,
  });

  currentSocket = sock;
  isConnecting = false;

  // Register event handlers
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => handleConnectionUpdate(sock, update, startBot));
  for (const { name, handler } of eventHandlers) {
    sock.ev.on(name, (data) => handler(sock, data));
  }
}

// Helper delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the bot
startBot().catch(err => console.error('Fatal error:', err));

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
