/**
 * REDXBOT – WhatsApp Bot
 * Owner: Abdul Rehman Rajpoot
 * Version: 4.1.0
 */

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { File } from 'megajs';
import axios from 'axios';
import ytSearch from 'yt-search';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== LOAD ALL ENVIRONMENT VARIABLES ====================
const env = process.env;

const config = {
  SESSION_ID: env.SESSION_ID || '',
  PREFIX: env.PREFIX || '.',
  BOT_NAME: env.BOT_NAME || 'REDXBOT',
  OWNER_NAME: env.OWNER_NAME || 'Abdul Rehman Rajpoot',
  OWNER_NUMBER: env.OWNER_NUMBER || '',
  STICKER_NAME: env.STICKER_NAME || 'redx bot',
  ALIVE_IMG: env.ALIVE_IMG || 'https://i.postimg.cc/LXCqjXmt/1765653734695.jpg',
  LIVE_MSG: env.LIVE_MSG || '> HEY IM ALIVE NOW *redx bot*⚡',
  MODE: env.MODE || 'public',
  PUBLIC_MODE: env.PUBLIC_MODE === 'true',
  ANTI_DELETE: env.ANTI_DELETE === 'true',
  ANTI_DEL_PATH: env.ANTI_DEL_PATH || 'inbox',
  ANTI_LINK: env.ANTI_LINK === 'true',
  ANTI_LINK_KICK: env.ANTI_LINK_KICK === 'true',
  ANTI_BAD: env.ANTI_BAD === 'true',
  ANTI_VV: env.ANTI_VV === 'true',
  AUTO_STATUS_SEEN: env.AUTO_STATUS_SEEN === 'true',
  AUTO_STATUS_REACT: env.AUTO_STATUS_REACT === 'true',
  AUTO_STATUS_REPLY: env.AUTO_STATUS_REPLY === 'true',
  AUTO_STATUS_MSG: env.AUTO_STATUS_MSG || '*SEEN YOUR STATUS BY REDX BOT 🤍*',
  AUTO_REACT: env.AUTO_REACT === 'true',
  CUSTOM_REACT: env.CUSTOM_REACT === 'true',
  CUSTOM_REACT_EMOJIS: env.CUSTOM_REACT_EMOJIS || '💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍',
  AUTO_TYPING: env.AUTO_TYPING === 'true',
  AUTO_RECORDING: env.AUTO_RECORDING === 'true',
  AUTO_REPLY: env.AUTO_REPLY === 'true',
  AUTO_STICKER: env.AUTO_STICKER === 'true',
  ALWAYS_ONLINE: env.ALWAYS_ONLINE === 'true',
  READ_CMD: env.READ_CMD === 'true',
  READ_MESSAGE: env.READ_MESSAGE === 'true',
  WELCOME: env.WELCOME === 'true',
  ADMIN_EVENTS: env.ADMIN_EVENTS === 'true',
  MENTION_REPLY: env.MENTION_REPLY === 'true',
  DELETE_LINKS: env.DELETE_LINKS === 'true',
  DESCRIPTION: env.DESCRIPTION || '*© CREATER abdul rehman rajpoot *',
  MENU_IMAGE_URL: env.MENU_IMAGE_URL || 'https://i.postimg.cc/LXCqjXmt/1765653734695.jpg',
  DEV: env.DEV || '923306137477',
  GITHUB_URL: env.GITHUB_URL || 'https://github.com/AbdulRehman19721986/REDXBOT-MD',
  WHATSAPP_GROUP: env.WHATSAPP_GROUP || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo',
  WHATSAPP_CHANNEL: env.WHATSAPP_CHANNEL || 'https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10',
  TELEGRAM_LINK: env.TELEGRAM_LINK || 'https://t.me/TeamRedxhacker2',
  YOUTUBE_LINK: env.YOUTUBE_LINK || 'https://youtube.com/@rootmindtech',
  BOT_PIC_URL: env.BOT_PIC_URL || 'https://image2url.com/r2/default/images/1772252008593-2690797c-4bd7-431e-b1f7-0f6ea21f7320.jpg',
};

if (!config.SESSION_ID) {
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

// ==================== COMMAND REGISTRY ====================
const commands = new Map();

function registerCommand(name, description, execute) {
  commands.set(name, { description, execute });
}

// Generate 100 test commands
for (let i = 0; i < 100; i++) {
  registerCommand(`ping${i}`, `Test command ${i}`, async (sock, from, args, msg) => {
    await sock.sendMessage(from, { text: `Pong ${i}!` });
  });
}

registerCommand('ping', 'Check bot response time.', async (sock, from, args, msg) => {
  const start = Date.now();
  await sock.sendMessage(from, { text: 'Pong! 🏓' });
  const latency = Date.now() - start;
  await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
});

registerCommand('test', 'Test if bot is working.', async (sock, from, args, msg) => {
  await sock.sendMessage(from, { text: '✅ Bot is working properly!' });
});

registerCommand('menu', 'Show all commands.', async (sock, from, args, msg) => {
  const cmdList = Array.from(commands.entries())
    .map(([name, cmd]) => `${config.PREFIX}${name} – ${cmd.description}`)
    .join('\n');
  const menuText = `
╔══════════════════════╗
║   🔥 *${config.BOT_NAME} MENU* 🔥  ║
╚══════════════════════╝

*Prefix:* ${config.PREFIX}
*Owner:* ${config.OWNER_NAME}

*Available Commands:*
${cmdList}

🔗 *Links:*
• GitHub: ${config.GITHUB_URL}
• WhatsApp Channel: ${config.WHATSAPP_CHANNEL}
• Telegram: ${config.TELEGRAM_LINK}
• YouTube: ${config.YOUTUBE_LINK}

✨ *Thank you for using ${config.BOT_NAME}!* ✨
  `;
  await sock.sendMessage(from, { text: menuText });
});

registerCommand('alive', 'Check if bot is alive.', async (sock, from, args, msg) => {
  try {
    const response = await fetch(config.ALIVE_IMG);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await sock.sendMessage(from, {
      image: buffer,
      caption: config.LIVE_MSG
    });
  } catch {
    await sock.sendMessage(from, { text: config.LIVE_MSG });
  }
});

registerCommand('owner', 'Show owner contact.', async (sock, from, args, msg) => {
  const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + config.OWNER_NAME + '\nTEL;waid=' + config.OWNER_NUMBER + ':+' + config.OWNER_NUMBER + '\nEND:VCARD';
  await sock.sendMessage(from, {
    contacts: { displayName: config.OWNER_NAME, contacts: [{ vcard }] }
  });
});

registerCommand('repo', 'Show repository info.', async (sock, from, args, msg) => {
  const repoMsg = `╭─〔 *${config.BOT_NAME} REPOSITORY* 〕\n│\n├─ 📌 Repository Name: REDXBOT-MD\n├─ 👑 Owner: ${config.OWNER_NAME}\n├─ ⭐ Stars: 100+\n├─ ⑂ Forks: 50+\n├─ 📝 Description: ${config.DESCRIPTION}\n│\n├─ 🔗 GitHub Link:\n│   ${config.GITHUB_URL}\n│\n├─ 🤖 Pair Link:\n│   http://redxpair.gt.tc\n│\n├─ 🌐 Join Channel:\n│   ${config.WHATSAPP_CHANNEL}\n╰───────────────────⊷`;
  await sock.sendMessage(from, { text: repoMsg });
});

registerCommand('features', 'Show bot features.', async (sock, from, args, msg) => {
  const features = `╔════════════════════════╗
║   ⚒️ *BOT FEATURES* ⚒️   ║
╚════════════════════════╝

🤖 *Ultimate Work* ➜ ✅ Active
🔁 *Anti-Delete* ➜ ${config.ANTI_DELETE ? '✅' : '❌'}
🎵 *24/7 Runtime* ➜ ✅ Active
📥 *Downloader* ➜ ✅ Active
🧠 *AI Chat* ➜ ✅ Active
👮 *Group Setting* ➜ ✅ Active
📛 *Auto Sticker* ➜ ${config.AUTO_STICKER ? '✅' : '❌'}
🎮 *Games* ➜ ✅ Active
🌐 *Web Pairing* ➜ ✅ Active
🎨 *Sticker Maker* ➜ ✅ Active
🚫 *Anti Link* ➜ ${config.ANTI_LINK ? '✅' : '❌'}
🚫 *Anti Bad* ➜ ${config.ANTI_BAD ? '✅' : '❌'}
👁️ *Auto Status Seen* ➜ ${config.AUTO_STATUS_SEEN ? '✅' : '❌'}
✨ *And many more!*`;
  await sock.sendMessage(from, { text: features });
});

registerCommand('mode', 'Change bot mode (public/private).', async (sock, from, args, msg) => {
  const sender = msg.key.participant || msg.key.remoteJid;
  if (sender !== config.OWNER_NUMBER + '@s.whatsapp.net') {
    return await sock.sendMessage(from, { text: '❌ Owner only.' });
  }
  if (!args[0] || !['public', 'private'].includes(args[0])) {
    return await sock.sendMessage(from, { text: 'Usage: .mode public or .mode private' });
  }
  config.PUBLIC_MODE = args[0] === 'public';
  await sock.sendMessage(from, { text: `✅ Mode set to ${args[0]}.` });
});

// Downloader commands
registerCommand('play', 'Download audio from YouTube.', async (sock, from, args, msg) => {
  if (!args[0]) return await sock.sendMessage(from, { text: '❌ Provide song name.' });
  const query = args.join(' ');
  try {
    const { videos } = await ytSearch(query);
    if (!videos.length) return await sock.sendMessage(from, { text: '❌ No results.' });
    const video = videos[0];
    const url = video.url;
    await sock.sendMessage(from, { text: `🎵 *${video.title}*\n📎 ${url}\n⏱️ ${video.timestamp}` });
  } catch (e) {
    logger.error(e);
    await sock.sendMessage(from, { text: '❌ Error fetching video.' });
  }
});

registerCommand('video', 'Download video from YouTube.', async (sock, from, args, msg) => {
  if (!args[0]) return await sock.sendMessage(from, { text: '❌ Provide video name.' });
  const query = args.join(' ');
  try {
    const { videos } = await ytSearch(query);
    if (!videos.length) return await sock.sendMessage(from, { text: '❌ No results.' });
    const video = videos[0];
    const url = video.url;
    await sock.sendMessage(from, { text: `🎬 *${video.title}*\n📎 ${url}\n⏱️ ${video.timestamp}` });
  } catch (e) {
    logger.error(e);
    await sock.sendMessage(from, { text: '❌ Error fetching video.' });
  }
});

registerCommand('ai', 'Chat with AI.', async (sock, from, args, msg) => {
  if (!args[0]) return await sock.sendMessage(from, { text: '❌ Provide message.' });
  const prompt = args.join(' ');
  try {
    const { data } = await axios.get(`https://api.akuari.my.id/ai/gpt?text=${encodeURIComponent(prompt)}`);
    const reply = data.respon || data.message || 'No response';
    await sock.sendMessage(from, { text: reply });
  } catch (e) {
    logger.error(e);
    await sock.sendMessage(from, { text: '❌ AI service unavailable.' });
  }
});

registerCommand('sticker', 'Create sticker from image/video.', async (sock, from, args, msg) => {
  if (!msg.message.imageMessage && !msg.message.videoMessage) {
    return await sock.sendMessage(from, { text: '❌ Reply to an image or video.' });
  }
  const stream = await sock.downloadMediaMessage(msg);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  try {
    const sticker = new Sticker(buffer, {
      pack: config.STICKER_NAME,
      author: config.BOT_NAME,
      type: StickerTypes.FULL,
      quality: 80
    });
    await sock.sendMessage(from, { sticker: await sticker.toBuffer() });
  } catch (e) {
    logger.error(e);
    await sock.sendMessage(from, { text: '❌ Failed to create sticker.' });
  }
});

registerCommand('setpp', 'Change bot profile picture (owner only).', async (sock, from, args, msg) => {
  const sender = msg.key.participant || msg.key.remoteJid;
  if (sender !== config.OWNER_NUMBER + '@s.whatsapp.net') {
    return await sock.sendMessage(from, { text: '❌ Owner only.' });
  }
  if (!msg.message.imageMessage) {
    return await sock.sendMessage(from, { text: '❌ Reply to an image.' });
  }
  const stream = await sock.downloadMediaMessage(msg);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  await sock.updateProfilePicture(sock.user.id, buffer);
  await sock.sendMessage(from, { text: '✅ Profile picture updated.' });
});

registerCommand('weather', 'Get weather info.', async (sock, from, args, msg) => {
  if (!args[0]) return await sock.sendMessage(from, { text: '❌ Provide city name.' });
  const city = args.join(' ');
  try {
    const { data } = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
    const weatherMsg = `*Weather in ${data.name}, ${data.sys.country}*\n🌡️ Temp: ${data.main.temp}°C\n☁️ ${data.weather[0].description}\n💧 Humidity: ${data.main.humidity}%\n💨 Wind: ${data.wind.speed} m/s`;
    await sock.sendMessage(from, { text: weatherMsg });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ City not found.' });
  }
});

registerCommand('quote', 'Random quote.', async (sock, from, args, msg) => {
  try {
    const { data } = await axios.get('https://api.quotable.io/random');
    await sock.sendMessage(from, { text: `"${data.content}"\n— ${data.author}` });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Could not fetch quote.' });
  }
});

registerCommand('fact', 'Random fact.', async (sock, from, args, msg) => {
  try {
    const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
    await sock.sendMessage(from, { text: data.text });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Could not fetch fact.' });
  }
});

registerCommand('calc', 'Calculate expression.', async (sock, from, args, msg) => {
  try {
    const result = eval(args.join(' '));
    await sock.sendMessage(from, { text: `= ${result}` });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Invalid expression.' });
  }
});

registerCommand('short', 'Shorten URL.', async (sock, from, args, msg) => {
  const url = args[0];
  if (!url) return await sock.sendMessage(from, { text: '❌ Provide URL.' });
  try {
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await sock.sendMessage(from, { text: data });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Failed to shorten.' });
  }
});

registerCommand('restart', 'Restart bot (owner only).', async (sock, from, args, msg) => {
  const sender = msg.key.participant || msg.key.remoteJid;
  if (sender !== config.OWNER_NUMBER + '@s.whatsapp.net') {
    return await sock.sendMessage(from, { text: '❌ Owner only.' });
  }
  await sock.sendMessage(from, { text: '🔄 Restarting...' });
  process.exit(0);
});

// Group admin commands
registerCommand('kick', 'Remove member from group.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  let user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
  if (!user) return await sock.sendMessage(from, { text: '❌ Mention or reply to user.' });
  await sock.groupParticipantsUpdate(from, [user], 'remove');
  await sock.sendMessage(from, { text: `✅ Removed @${user.split('@')[0]}`, mentions: [user] });
});

registerCommand('add', 'Add member to group.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  if (!args[0]) return await sock.sendMessage(from, { text: '❌ Provide phone number.' });
  const user = args[0] + '@s.whatsapp.net';
  await sock.groupParticipantsUpdate(from, [user], 'add');
  await sock.sendMessage(from, { text: `✅ Added @${args[0]}`, mentions: [user] });
});

registerCommand('promote', 'Promote member to admin.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  let user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
  if (!user) return await sock.sendMessage(from, { text: '❌ Mention or reply to user.' });
  await sock.groupParticipantsUpdate(from, [user], 'promote');
  await sock.sendMessage(from, { text: `✅ @${user.split('@')[0]} promoted.`, mentions: [user] });
});

registerCommand('demote', 'Demote admin to member.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  let user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
  if (!user) return await sock.sendMessage(from, { text: '❌ Mention or reply to user.' });
  await sock.groupParticipantsUpdate(from, [user], 'demote');
  await sock.sendMessage(from, { text: `✅ @${user.split('@')[0]} demoted.`, mentions: [user] });
});

registerCommand('mute', 'Mute group.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  await sock.groupSettingUpdate(from, 'announcement');
  await sock.sendMessage(from, { text: '🔇 Group muted.' });
});

registerCommand('unmute', 'Unmute group.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  await sock.groupSettingUpdate(from, 'not_announcement');
  await sock.sendMessage(from, { text: '🔊 Group unmuted.' });
});

registerCommand('invite', 'Get group invite link.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  const code = await sock.groupInviteCode(from);
  await sock.sendMessage(from, { text: `📎 Invite link: https://chat.whatsapp.com/${code}` });
});

registerCommand('revoke', 'Revoke group invite link.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
  if (!isBotAdmin) return await sock.sendMessage(from, { text: '❌ I need to be admin.' });
  await sock.groupRevokeInvite(from);
  await sock.sendMessage(from, { text: '🔄 Invite link revoked.' });
});

registerCommand('tag', 'Tag all members.', async (sock, from, args, msg) => {
  if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Group only.' });
  const participants = await sock.groupMetadata(from);
  const jids = participants.participants.map(p => p.id);
  const text = args.join(' ') || '📢 @all';
  await sock.sendMessage(from, { text, mentions: jids });
});

// ==================== FEATURE IMPLEMENTATIONS ====================
const deletedMessages = new Map();
const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt', 'nigger', 'nigga'];

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

async function clearSessionFolder() {
  const sessionPath = path.join(__dirname, 'sessions');
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    logger.info('🧹 Cleared session folder.');
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

  if (!cachedCreds) {
    cachedCreds = await loadSessionFromMega(config.SESSION_ID);
  }

  const { state, saveCreds } = await useMultiFileAuthState('./sessions', {
    creds: cachedCreds || undefined
  });

  const { version } = await fetchLatestBaileysVersion();

  const keyStoreLogger = pino({ level: 'fatal' });

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, keyStoreLogger),
    },
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: [config.BOT_NAME, 'Safari', '1.0.0'],
    markOnlineOnConnect: config.ALWAYS_ONLINE,
    syncFullHistory: false,
    shouldSyncHistoryMessage: false,
    getMessage: async () => undefined,
  });

  currentSocket = sock;
  isConnecting = false;

  // ==================== EVENT HANDLERS ====================

  // Store messages for anti-delete
  if (config.ANTI_DELETE) {
    sock.ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (msg.message) {
          deletedMessages.set(msg.key.id, msg);
          if (deletedMessages.size > 1000) {
            const firstKey = deletedMessages.keys().next().value;
            deletedMessages.delete(firstKey);
          }
        }
      }
    });
  }

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || from;
    const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';
    const isBot = sender === sock.user.id;

    // Auto-typing / recording
    if (config.AUTO_TYPING && !isBot && from !== 'status@broadcast') {
      await sock.sendPresenceUpdate('composing', from);
    }
    if (config.AUTO_RECORDING && !isBot && from !== 'status@broadcast') {
      await sock.sendPresenceUpdate('recording', from);
    }

    // Auto-react
    if (config.AUTO_REACT && !isBot && from !== 'status@broadcast') {
      const emojis = config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim());
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      await sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } });
    }

    // Read message
    if (config.READ_MESSAGE && from !== 'status@broadcast') {
      await sock.readMessages([msg.key]);
    }

    // Anti-link in groups
    if (isGroup && config.ANTI_LINK && !isOwner && !isBot) {
      let text = '';
      if (msg.message.conversation) text = msg.message.conversation;
      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
      if (text && /(https?:\/\/[^\s]+)|(www\.[^\s]+)/.test(text)) {
        const participants = await sock.groupMetadata(from);
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
        if (isBotAdmin) {
          if (config.ANTI_LINK_KICK) {
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            await sock.sendMessage(from, { text: `❌ Link posted. User removed.` });
          } else {
            await sock.sendMessage(from, { text: `❌ Links are not allowed.`, delete: msg.key });
          }
          return;
        }
      }
    }

    // Anti-bad words
    if (isGroup && config.ANTI_BAD && !isOwner && !isBot) {
      let text = '';
      if (msg.message.conversation) text = msg.message.conversation;
      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
      if (text) {
        const lower = text.toLowerCase();
        const found = badWords.some(word => lower.includes(word));
        if (found) {
          const participants = await sock.groupMetadata(from);
          const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
          if (isBotAdmin) {
            await sock.sendMessage(from, { text: `❌ Bad words are not allowed.`, delete: msg.key });
            return;
          }
        }
      }
    }

    // Auto-sticker
    if (config.AUTO_STICKER && !isBot && (msg.message.imageMessage || msg.message.videoMessage)) {
      try {
        const stream = await sock.downloadMediaMessage(msg);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        const sticker = new Sticker(buffer, {
          pack: config.STICKER_NAME,
          author: config.BOT_NAME,
          type: StickerTypes.FULL,
          quality: 80
        });
        await sock.sendMessage(from, { sticker: await sticker.toBuffer() });
      } catch (e) {
        logger.error('Auto-sticker failed:', e);
      }
    }

    // Extract text for commands
    let text = '';
    if (msg.message.conversation) text = msg.message.conversation;
    else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
    else return;

    const trimmedText = text.trim().toLowerCase();

    // Direct "ping"
    if (trimmedText === 'ping' && !isBot) {
      const start = Date.now();
      await sock.sendMessage(from, { text: 'Pong! 🏓 (direct)' });
      const latency = Date.now() - start;
      await sock.sendMessage(from, { text: `Response time: ${latency}ms` });
      return;
    }

    // Prefixed commands
    if (!text.startsWith(config.PREFIX)) return;
    const args = text.slice(config.PREFIX.length).trim().split(' ');
    const cmdName = args.shift().toLowerCase();

    const shouldRespond = config.PUBLIC_MODE || isOwner || (isGroup && config.MODE === 'public');
    if (!shouldRespond) return;

    if (config.READ_CMD && from !== 'status@broadcast') {
      await sock.readMessages([msg.key]);
    }

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
      await sock.sendMessage(from, { text: `❌ Unknown command. Use ${config.PREFIX}menu to see available commands.` });
    }
  });

  // messages.update (anti-delete)
  sock.ev.on('messages.update', async (updates) => {
    if (!config.ANTI_DELETE) return;
    for (const update of updates) {
      if (update.update.messageStubType === 5 || update.update.messageStubType === 6) {
        const key = update.key;
        const msg = deletedMessages.get(key.id);
        if (msg) {
          const from = key.remoteJid;
          const sender = key.participant || key.remoteJid;
          const deletedContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Media]';
          const target = config.ANTI_DEL_PATH === 'same' ? from : config.OWNER_NUMBER + '@s.whatsapp.net';
          await sock.sendMessage(target, { text: `🚫 *Deleted Message*\nFrom: @${sender.split('@')[0]}\nContent: ${deletedContent}`, mentions: [sender] });
        }
      }
    }
  });

  // group-participants.update (welcome, goodbye, admin events)
  sock.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
    if (!config.WELCOME && !config.ADMIN_EVENTS) return;
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;

    for (const jid of participants) {
      const name = jid.split('@')[0];
      if (action === 'add' && config.WELCOME) {
        await sock.sendMessage(id, { text: `👋 Welcome @${name} to *${groupName}!*`, mentions: [jid] });
      } else if (action === 'remove' && config.WELCOME) {
        await sock.sendMessage(id, { text: `👋 Goodbye @${name} from *${groupName}.*`, mentions: [jid] });
      } else if (action === 'promote' && config.ADMIN_EVENTS) {
        await sock.sendMessage(id, { text: `👑 @${name} has been promoted to admin.`, mentions: [jid] });
      } else if (action === 'demote' && config.ADMIN_EVENTS) {
        await sock.sendMessage(id, { text: `⬇️ @${name} has been demoted from admin.`, mentions: [jid] });
      }
    }
  });

  // status updates
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.remoteJid !== 'status@broadcast') continue;
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const text = msg.message?.conversation || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || '';

      if (config.AUTO_STATUS_SEEN) {
        await sock.readMessages([msg.key]);
      }

      if (config.AUTO_STATUS_REACT) {
        const emojis = config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim());
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        await sock.sendMessage(sender, { react: { text: randomEmoji, key: msg.key } });
      }

      if (config.AUTO_STATUS_REPLY && config.AUTO_STATUS_MSG) {
        await sock.sendMessage(sender, { text: config.AUTO_STATUS_MSG, quoted: msg });
      }
    }
  });

  // creds.update
  sock.ev.on('creds.update', saveCreds);

  // connection.update
  sock.ev.on('connection.update', (update) => handleConnectionUpdate(sock, update));

  async function handleConnectionUpdate(sock, update) {
    const { connection, lastDisconnect, qr } = update;
    if (qr) return;

    if (connection === "close") {
      const error = lastDisconnect?.error;
      const statusCode = error?.output?.statusCode;
      const message = error?.message || 'Unknown error';
      logger.warn(`Connection closed. Status code: ${statusCode}, Reason: ${message}`);

      if (statusCode === 440 || statusCode === 401) {
        logger.error(`
╔════════════════════════════════════════════════════════╗
║                   ❗ CONFLICT DETECTED                   ║
╠════════════════════════════════════════════════════════╣
║ Another device is using this WhatsApp number.           ║
║ The bot cannot stay connected.                          ║
╟────────────────────────────────────────────────────────╢
║ ✅ FIX:                                                  ║
║ 1. Open WhatsApp on your phone.                         ║
║ 2. Go to Settings → Linked Devices.                     ║
║ 3. Log out from ALL devices.                            ║
║ 4. Restart this bot.                                    ║
╚════════════════════════════════════════════════════════╝`);
        await clearSessionFolder();
        process.exit(1);
      } else {
        await delay(5000);
        startBot();
      }
    } else if (connection === "open") {
      logger.info("✅ Bot connected to WhatsApp!");
      await sendWelcomeMessage(sock);
    }
  }

  async function sendWelcomeMessage(sock) {
    if (!config.OWNER_NUMBER) {
      logger.warn('OWNER_NUMBER not set – skipping welcome message.');
      return;
    }
    const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
    try {
      const response = await fetch(config.BOT_PIC_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const welcomeText = `
╔══════════════════════╗
║   🔥 *${config.BOT_NAME}* 🔥   ║
╚══════════════════════╝

✅ *Bot is now online!*

📌 *Prefix:* ${config.PREFIX}
👑 *Owner:* ${config.OWNER_NAME}
👤 *Mode:* ${config.MODE}

🔗 *Important Links:*
• GitHub: ${config.GITHUB_URL}
• WhatsApp Channel: ${config.WHATSAPP_CHANNEL}
• WhatsApp Group: ${config.WHATSAPP_GROUP}
• Telegram: ${config.TELEGRAM_LINK}
• YouTube: ${config.YOUTUBE_LINK}

✨ *Thank you for using ${config.BOT_NAME}!* ✨
    `;

      await sock.sendMessage(ownerJid, {
        image: buffer,
        caption: welcomeText
      });
      logger.info('📨 Heavy welcome message sent to owner.');
    } catch (err) {
      logger.error('Failed to send welcome message with image:', err);
      const plainText = welcomeText.replace(/[│╔╗╚╝]/g, '');
      try {
        await sock.sendMessage(ownerJid, { text: plainText });
        logger.info('📨 Text‑only welcome message sent as fallback.');
      } catch (fallbackErr) {
        logger.error('Fallback welcome message also failed:', fallbackErr);
      }
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

startBot().catch(err => logger.error('Fatal error:', err));

process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
