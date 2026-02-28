import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import { File } from 'megajs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './config.js';

// Import CommonJS command module
import commandModule from './command.cjs';
const { commands, cmd } = commandModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

// Ensure session directory exists
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// Load session from Mega if SESSION_ID is provided
async function loadSession() {
    try {
        if (!config.SESSION_ID) {
            console.log('ℹ️ No SESSION_ID provided – QR login will be used');
            return null;
        }

        console.log('⏳ Downloading session from Mega...');
        // Remove "IK~" prefix if present (your pairing site adds it)
        const megaFileId = config.SESSION_ID.startsWith('IK~')
            ? config.SESSION_ID.replace('IK~', '')
            : config.SESSION_ID;

        const file = File.fromURL(`https://mega.nz/file/${megaFileId}`);
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        fs.writeFileSync(credsPath, data);
        console.log('✅ Session downloaded from Mega');
        return JSON.parse(data.toString());
    } catch (error) {
        console.error('❌ Failed to load session from Mega:', error.message);
        console.log('ℹ️ Will generate QR code instead');
        return null;
    }
}

// Main connection function
async function connectToWA() {
    console.log('[🔰] redxbot302 Connecting to WhatsApp...');

    const creds = await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir, {
        creds: creds || undefined
    });

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !creds,          // Show QR only if no session
        browser: Browsers.macOS('Firefox'),
        syncFullHistory: true,
        auth: state,
        version,
        getMessage: async () => ({})
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !creds) {
            console.log('📱 Scan the QR code above to connect');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('[🔰] Connection lost, reconnecting in 5 seconds...');
                setTimeout(connectToWA, 5000);
            } else {
                console.log('[🔰] Logged out. Please provide a new SESSION_ID');
            }
        } else if (connection === 'open') {
            console.log('[✅] redxbot302 connected to WhatsApp');

            // Send startup message to owner (optional)
            try {
                const upMessage = `╭─〔 *${config.BOT_NAME}* 〕  
├─▸ *Your bot is online!*  
╰─🚀 *Powered by Abdul Rehman Rajpoot*`;
                await sock.sendMessage(sock.user.id, { text: upMessage });
            } catch (e) {}

            console.log(`[✅] Loaded ${commands.length} commands`);
        }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Message handler – process incoming messages using your commands
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const sender = m.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderId = isGroup ? m.key.participant : sender;
        const prefix = config.PREFIX;

        // Ignore own messages and non-text messages
        if (m.key.fromMe) return;
        if (!messageText.startsWith(prefix)) return;

        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Find matching command
        const command = commands.find(cmd => 
            cmd.pattern?.test(commandName) || cmd.name === commandName
        );

        if (command) {
            try {
                await command.function(sock, m, args, { isGroup, sender, prefix, config });
            } catch (err) {
                console.error('Command error:', err);
                await sock.sendMessage(sender, { text: 'An error occurred while executing the command.' });
            }
        }
    });

    return sock;
}

// Start the bot
connectToWA().catch(console.error);
