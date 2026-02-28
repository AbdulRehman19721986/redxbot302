import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync('config.env')) dotenv.config({ path: './config.env' });

const config = {
    // Required
    SESSION_ID: process.env.SESSION_ID || '',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '61468259338',  // Your number
    PREFIX: process.env.PREFIX || '.',

    // Optional with defaults
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || 'true',
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'false',
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || 'true',
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || '*SEEN YOUR STATUS BY REDXBOT302 🤍*',
    ANTI_DELETE: process.env.ANTI_DELETE || 'true',
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || 'inbox',
    WELCOME: process.env.WELCOME || 'false',
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || 'false',
    ANTI_LINK: process.env.ANTI_LINK || 'true',
    MENTION_REPLY: process.env.MENTION_REPLY || 'false',
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || 'https://files.catbox.moe/dck7xl.jpg',
    BOT_NAME: process.env.BOT_NAME || 'redxbot302',
    STICKER_NAME: process.env.STICKER_NAME || 'redxbot302',
    CUSTOM_REACT: process.env.CUSTOM_REACT || 'false',
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || '💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍',
    DELETE_LINKS: process.env.DELETE_LINKS || 'false',
    OWNER_NAME: process.env.OWNER_NAME || 'Abdul Rehman Rajpoot',
    DESCRIPTION: process.env.DESCRIPTION || '*© CREATOR abdul rehman rajpoot *',
    ALIVE_IMG: process.env.ALIVE_IMG || 'https://files.catbox.moe/dck7xl.jpg',
    LIVE_MSG: process.env.LIVE_MSG || '> HEY IM ALIVE NOW *redxbot302*⚡',
    READ_MESSAGE: process.env.READ_MESSAGE || 'false',
    AUTO_REACT: process.env.AUTO_REACT || 'false',
    ANTI_BAD: process.env.ANTI_BAD || 'false',
    MODE: process.env.MODE || 'public',
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || 'false',
    AUTO_STICKER: process.env.AUTO_STICKER || 'false',
    AUTO_REPLY: process.env.AUTO_REPLY || 'false',
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || 'false',
    PUBLIC_MODE: process.env.PUBLIC_MODE || 'true',
    AUTO_TYPING: process.env.AUTO_TYPING || 'true',
    READ_CMD: process.env.READ_CMD || 'false',
    DEV: process.env.DEV || '61468259338',
    ANTI_VV: process.env.ANTI_VV || 'true',
    AUTO_RECORDING: process.env.AUTO_RECORDING || 'false',
};

export default config;
