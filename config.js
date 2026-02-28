import fs from 'fs';
import path from 'path';
import { File } from 'megajs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (fs.existsSync('config.env')) {
    import('dotenv').then(dotenv => dotenv.config({ path: './config.env' }));
}

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

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

export const SESSION_ID = process.env.SESSION_ID || "";
export const AUTO_STATUS_SEEN = process.env.AUTO_STATUS_SEEN || "true";
export const AUTO_STATUS_REPLY = process.env.AUTO_STATUS_REPLY || "false";
export const AUTO_STATUS_REACT = process.env.AUTO_STATUS_REACT || "true";
export const AUTO_STATUS_MSG = process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY REDXBOT302 🤍*";
export const ANTI_DELETE = process.env.ANTI_DELETE || "true";
export const ANTI_DEL_PATH = process.env.ANTI_DEL_PATH || "inbox";
export const WELCOME = process.env.WELCOME || "false";
export const ADMIN_EVENTS = process.env.ADMIN_EVENTS || "false";
export const ANTI_LINK = process.env.ANTI_LINK || "true";
export const MENTION_REPLY = process.env.MENTION_REPLY || "false";
export const MENU_IMAGE_URL = process.env.MENU_IMAGE_URL || "https://files.catbox.moe/4964gx.jpg";
export const PREFIX = process.env.PREFIX || ".";
export const BOT_NAME = process.env.BOT_NAME || "REDXBOT302";
export const STICKER_NAME = process.env.STICKER_NAME || "redx bot";
export const CUSTOM_REACT = process.env.CUSTOM_REACT || "false";
export const CUSTOM_REACT_EMOJIS = process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍";
export const DELETE_LINKS = process.env.DELETE_LINKS || "false";
export const OWNER_NUMBER = process.env.OWNER_NUMBER || "923009842133";
export const OWNER_NAME = process.env.OWNER_NAME || "Abdul Rehman Rajpoot";
export const DESCRIPTION = process.env.DESCRIPTION || "*© CREATED BY Abdul Rehman Rajpoot *";
export const ALIVE_IMG = process.env.ALIVE_IMG || "https://files.catbox.moe/4964gx.jpg";
export const LIVE_MSG = process.env.LIVE_MSG || "> HEY IM ALIVE NOW *REDXBOT302*⚡";
export const READ_MESSAGE = process.env.READ_MESSAGE || "false";
export const AUTO_REACT = process.env.AUTO_REACT || "false";
export const ANTI_BAD = process.env.ANTI_BAD || "false";
export const MODE = process.env.MODE || "public";
export const ANTI_LINK_KICK = process.env.ANTI_LINK_KICK || "false";
export const AUTO_STICKER = process.env.AUTO_STICKER || "false";
export const AUTO_REPLY = process.env.AUTO_REPLY || "false";
export const ALWAYS_ONLINE = process.env.ALWAYS_ONLINE || "false";
export const PUBLIC_MODE = process.env.PUBLIC_MODE || "true";
export const AUTO_TYPING = process.env.AUTO_TYPING || "true";
export const READ_CMD = process.env.READ_CMD || "false";
export const DEV = process.env.DEV || "923306137477";
export const ANTI_VV = process.env.ANTI_VV || "true";
export const AUTO_RECORDING = process.env.AUTO_RECORDING || "false";

export const loadSessionFromMega = loadSessionFromMega;
