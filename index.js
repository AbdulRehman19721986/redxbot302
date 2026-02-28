/**
 * REDXBOT – WhatsApp Bot
 * Owner: Abdul Rehman Rajpoot
 * Version: 1.0.0
 */

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION ====================
let config = {
  bot: {
    name: "REDXBOT",
    online: true,
    prefix: "!",
    history: false
  },
  logging: {
    level: "info",
    logToFile: true
  }
};

try {
  const file = fs.readFileSync("./bot.yml", "utf8");
  config = yaml.load(file);
} catch (e) {
  console.warn("⚠️ Failed to load bot.yml, using defaults.");
}

// Override with environment if needed
const BOT_NAME = process.env.BOT_NAME || config.bot?.name || "REDXBOT";
const PREFIX = process.env.PREFIX || config.bot?.prefix || "!";
const OWNER_NAME = process.env.OWNER_NAME || "Abdul Rehman Rajpoot";
const OWNER_NUMBER = process.env.OWNER_NUMBER || "";

// ==================== LOGGER ====================
const logger = pino({
  level: config.logging?.level || "info",
  transport: config.logging?.logToFile
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

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

// ----- image command -----
commands.set('image', {
  description: 'Send an image.',
  execute: async (sock, from, args) => {
    await sock.sendMessage(from, {
      image: { url: "https://www.nexoscreator.tech/logo.png" }, // replace with your own image
      caption: `Here is an image from ${BOT_NAME}!`
    });
  }
});

// ----- ping command -----
commands.set('ping', {
  description: 'Check bot response time.',
  execute: async (sock, from, args) => {
    const start = Date.now();
    const sent = await sock.sendMessage(from, { text: 'Pong! 🏓' });
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
    logger.info("Scan the QR below to login:");
    console.info(await QRCode.toString(qr, { type: "terminal", small: true }));
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

// Placeholder for other events – you can expand as needed
const eventHandlers = [
  { name: 'messages.upsert', handler: handleMessagesUpsert },
  // Add other events here if desired (e.g., group-participants.update, etc.)
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
let cachedCreds = null;
let currentSocket = null;
let reconnectTimeout = null;
let isConnecting = false;
const MAX_RECONNECT_ATTEMPTS = 5;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  if (currentSocket) {
    currentSocket.ev.removeAllListeners();
    await currentSocket.end().catch(() => {});
    currentSocket = null;
  }
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  // (Optional) Load session from MEGA if you have a SESSION_ID variable.
  // If not, we rely on local auth folder.

  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
    },
    printQRInTerminal: false, // we handle QR in connection.update
    logger: pino({ level: 'silent' }),
    browser: [BOT_NAME, 'Safari', '1.0.0'],
    markOnlineOnConnect: config.bot?.online || true,
    syncFullHistory: config.bot?.history || false,
    shouldSyncHistoryMessage: config.bot?.history || false,
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
startBot().catch(err => logger.error('Fatal error:', err));

process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
