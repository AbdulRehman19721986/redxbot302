const fs = require('fs');
const path = require('path');
const { File } = require('megajs');

if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

// Helper to convert string to boolean
function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

// MEGA session downloader
async function loadSessionFromMega(sessionId) {
    const sessionDir = path.join(__dirname, 'sessions');
    const credsPath = path.join(sessionDir, 'creds.json');

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    if (!sessionId) {
        console.log('No SESSION_ID provided – will generate QR code.');
        return null;
    }

    console.log('[⏳] Downloading session from MEGA...');

    // Remove "IK~" prefix if present
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

module.exports = {
    // Environment variables
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
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/4964gx.jpg",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "REDXBOT302",
    STICKER_NAME: process.env.STICKER_NAME || "redx bot",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    DELETE_LINKS: process.env.DELETE_LINKS || "false",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "923306137477",
    OWNER_NAME: process.env.OWNER_NAME || "Abdul Rehman Rajpoot",
    DESCRIPTION: process.env.DESCRIPTION || "*© CREATED BY Abdul Rehman Rajpoot *",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/4964gx.jpg",
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
    DEV: process.env.DEV || "923306137477",
    ANTI_VV: process.env.ANTI_VV || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",

    // MEGA downloader
    loadSessionFromMega,
};
