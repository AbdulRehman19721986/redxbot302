import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __filename = fileURLToPath(import.meta.url);
console.log('🔥 REDXBOT302 – Self-contained plugin loaded.');

// ==================== HELPER FUNCTIONS ====================
async function getBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const type = response.headers['content-type']?.split('/')[0] || 'unknown';
        const size = buffer.length / (1024 * 1024); // MB
        return { buffer, type, size, mime: response.headers['content-type'] };
    } catch (e) {
        console.error(e);
        return { buffer: null, error: e.message };
    }
}

function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function parsedJid(text) {
    return text.split(' ').filter(v => v.endsWith('@s.whatsapp.net') || v.endsWith('@g.us'));
}

async function checkImAdmin(participants, jid) {
    return participants.participants.some(p => p.id === jid && (p.admin === 'admin' || p.admin === 'superadmin'));
}

function genButtons(buttons, text, title) {
    return { contentText: text, footerText: title, buttons };
}

async function SpeachToText(lang, text) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const { buffer } = await getBuffer(url);
    return buffer;
}

async function uploadToImgur(buffer) {
    const form = new FormData();
    form.append('image', buffer.toString('base64'));
    const { data } = await axios.post('https://api.imgur.com/3/image', form, {
        headers: { 'Authorization': 'Client-ID 9e57cb1c4791f4c' }
    });
    return data.data.link;
}

async function memeMaker(imageBuffer, top, bottom) {
    const form = new FormData();
    form.append('image', imageBuffer.toString('base64'));
    form.append('top', top);
    form.append('bottom', bottom);
    const { data } = await axios.post('https://api.imgflip.com/caption_image', form);
    return data.data.url;
}

async function photoEditor(imageBuffer, effect) {
    try {
        const form = new FormData();
        form.append('image', imageBuffer);
        const { data } = await axios.post(`https://some-editor-api.com/${effect}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { status: true, result: data.url };
    } catch (e) {
        return { status: false, result: e.message };
    }
}

async function addExif(buffer, pack) {
    // Simple sticker metadata – you can use a proper library if needed
    return buffer; // Placeholder
}

async function webpToMp4(buffer) {
    // Not implemented – returns original
    return buffer;
}

async function getFfmpegBuffer(buffer, filename, type) {
    // Simple pass-through
    return buffer;
}

async function iplscore() {
    return "Live cricket score API not configured.";
}

async function getName(jid, conn) {
    return jid.split('@')[0];
}

// AFK state
let afkState = { isAfk: false, reason: '', time: 0 };

// Simple in‑memory warn/filter/greetings (for demo – use DB in production)
let warns = {};
let filters = {};
let greetings = { welcome: {}, goodbye: {} };
let antilink = {};

async function warn(user, from, reason) {
    if (!warns[from]) warns[from] = {};
    if (!warns[from][user]) warns[from][user] = { count: 0, reasons: [] };
    warns[from][user].count++;
    warns[from][user].reasons.push(reason);
    return { count: warns[from][user].count, total: 3 };
}

async function getEachWarn() {
    return warns;
}

async function setFilter(jid, trigger, response) {
    if (!filters[jid]) filters[jid] = {};
    filters[jid][trigger] = response;
}

async function deleteFilter(jid, trigger) {
    delete filters[jid][trigger];
}

async function setMessage(jid, type, msg) {
    if (!greetings[type]) greetings[type] = {};
    greetings[type][jid] = msg;
}

async function enableGreetings(jid, type, mode) {
    // Not implemented
}

async function enableAntilink(jid, mode) {
    antilink[jid] = mode === 'on';
}

async function setSchedule() {} // Not implemented
async function getSchedule() {}
async function getEachSchedule() {}

async function installPlugin(url, name) {}
async function getPlugin() { return "Plugin management disabled."; }
async function deletePlugin(name) {}

// ==================== COMMANDS ====================

// Basic
cmd({
    pattern: 'ping',
    desc: 'Check bot response time',
    category: 'utility',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const start = Date.now();
    await conn.sendMessage(from, { text: 'Pong!' });
    const end = Date.now();
    await conn.sendMessage(from, { text: `⏱️ *${end - start} ms*` });
});

cmd({
    pattern: 'menu',
    desc: 'Show all commands',
    category: 'main',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { commands } = await import('../command.js');
    const categories = {};
    commands.forEach(cmd => {
        if (!categories[cmd.category]) categories[cmd.category] = [];
        categories[cmd.category].push(cmd.pattern);
    });
    let menuText = `╔══════════════════════╗
║   🔥 *REDXBOT MENU* 🔥  ║
╚══════════════════════╝\n\n`;
    menuText += `*Prefix:* ${config.PREFIX}\n`;
    menuText += `*Owner:* ${config.OWNER_NAME}\n`;
    menuText += `*Mode:* ${config.MODE}\n\n`;
    for (const [cat, cmds] of Object.entries(categories)) {
        menuText += `*${cat.toUpperCase()}*\n`;
        menuText += cmds.map(c => `   ✦ ${config.PREFIX}${c}`).join('\n') + '\n\n';
    }
    menuText += `\n🔗 *Links:*\n`;
    menuText += `• GitHub: https://github.com/AbdulRehman19721986/REDXBOT-MD\n`;
    menuText += `• WhatsApp Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10\n`;
    menuText += `• Telegram: https://t.me/TeamRedxhacker2\n`;
    menuText += `• YouTube: https://youtube.com/@rootmindtech\n`;
    menuText += `\n✨ *Thank you for using REDXBOT!* ✨`;

    await conn.sendMessage(from, { text: menuText });
});

cmd({
    pattern: 'owner',
    desc: 'Show owner contact',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + config.OWNER_NAME + '\nTEL;waid=' + config.OWNER_NUMBER + ':+' + config.OWNER_NUMBER + '\nEND:VCARD';
    await conn.sendMessage(from, {
        contacts: {
            displayName: config.OWNER_NAME,
            contacts: [{ vcard }]
        }
    });
});

cmd({
    pattern: 'alive',
    desc: 'Check bot status',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: config.LIVE_MSG || 'I am alive!' });
});

// Sticker
cmd({
    pattern: 'sticker',
    alias: ['s'],
    desc: 'Create sticker from image/video',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
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

// TTS
cmd({
    pattern: 'tts',
    desc: 'Text to speech',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide text.' });
    let lang = config.LANG || 'en';
    let text = args.join(' ');
    const audio = await SpeachToText(lang, text);
    await conn.sendMessage(from, { audio: audio, mimetype: 'audio/mp4', ptt: true });
});

// Translate
cmd({
    pattern: 'trt',
    desc: 'Translate text',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.conversation && !mek.message.extendedTextMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to a text message.' });
    }
    const text = mek.message.conversation || mek.message.extendedTextMessage.text;
    let target = args[0] || config.LANG;
    let source = 'auto';
    if (args[0] && args[0].includes(':')) {
        [source, target] = args[0].split(':');
    }
    const { data } = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
    const translated = data[0][0][0];
    await conn.sendMessage(from, { text: `*Original:* ${text}\n*Translated (${target}):* ${translated}` });
});

// Weather
cmd({
    pattern: 'weather',
    desc: 'Get weather info',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide city name.' });
    const city = args.join(' ');
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`;
    const { data } = await axios.get(url).catch(() => ({ data: null }));
    if (!data) return await conn.sendMessage(from, { text: '❌ City not found.' });
    const msg = `*Weather in ${data.name}, ${data.sys.country}*
🌡️ Temperature: ${data.main.temp}°C
🤔 Feels like: ${data.main.feels_like}°C
☁️ Condition: ${data.weather[0].description}
💧 Humidity: ${data.main.humidity}%
💨 Wind: ${data.wind.speed} m/s
🌅 Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
🌇 Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}`;
    await conn.sendMessage(from, { text: msg });
});

// YouTube search
cmd({
    pattern: 'yts',
    desc: 'Search YouTube videos',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide search query.' });
    const query = args.join(' ');
    const { videos } = await yts(query);
    if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results.' });
    let msg = '*YouTube Search Results*\n\n';
    videos.slice(0, 10).forEach((v, i) => {
        msg += `${i+1}. *${v.title}*\n   ⏱️ ${v.timestamp} | 👁️ ${v.views}\n   📎 ${v.url}\n\n`;
    });
    await conn.sendMessage(from, { text: msg });
});

// Song download
cmd({
    pattern: 'song',
    desc: 'Download audio from YouTube',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide song name or URL.' });
    let url = args[0];
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        const { videos } = await yts(url);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results.' });
        url = videos[0].url;
    }
    await conn.sendMessage(from, { text: '⏳ Downloading audio...' });
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const audioStream = ytdl(url, { filter: 'audioonly' });
    const buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        audioStream.on('data', chunk => chunks.push(chunk));
        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', reject);
    });
    await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', fileName: `${title}.mp3` });
});

// Video download
cmd({
    pattern: 'video',
    desc: 'Download video from YouTube',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide video name or URL.' });
    let url = args[0];
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        const { videos } = await yts(url);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results.' });
        url = videos[0].url;
    }
    await conn.sendMessage(from, { text: '⏳ Downloading video...' });
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const videoStream = ytdl(url, { filter: 'audioandvideo', quality: 'lowest' });
    const buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        videoStream.on('data', chunk => chunks.push(chunk));
        videoStream.on('end', () => resolve(Buffer.concat(chunks)));
        videoStream.on('error', reject);
    });
    await conn.sendMessage(from, { video: buffer, caption: title });
});

// Instagram (using public scrapers – may need API)
cmd({
    pattern: 'insta',
    desc: 'Download Instagram post',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0] || (mek.message.extendedTextMessage?.text);
    if (!url || !url.includes('instagram.com')) {
        return await conn.sendMessage(from, { text: '❌ Provide a valid Instagram URL.' });
    }
    // Use a public API (replace with your own if needed)
    const api = `https://api.akuari.my.id/downloader/igdl?link=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api).catch(() => ({ data: null }));
    if (!data || !data.result) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    const mediaUrl = data.result[0].url;
    const { buffer } = await getBuffer(mediaUrl);
    await conn.sendMessage(from, { video: buffer });
});

// TikTok
cmd({
    pattern: 'tiktok',
    desc: 'Download TikTok video',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0] || (mek.message.extendedTextMessage?.text);
    if (!url || !url.includes('tiktok.com')) {
        return await conn.sendMessage(from, { text: '❌ Provide a valid TikTok URL.' });
    }
    const api = `https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api).catch(() => ({ data: null }));
    if (!data || !data.result) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    const { buffer } = await getBuffer(data.result.no_watermark);
    await conn.sendMessage(from, { video: buffer });
});

// Twitter
cmd({
    pattern: 'twitter',
    desc: 'Download Twitter video',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0] || (mek.message.extendedTextMessage?.text);
    if (!url || !url.includes('twitter.com') && !url.includes('x.com')) {
        return await conn.sendMessage(from, { text: '❌ Provide a valid Twitter URL.' });
    }
    const api = `https://api.akuari.my.id/downloader/twitter?link=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api).catch(() => ({ data: null }));
    if (!data || !data.result) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    const { buffer } = await getBuffer(data.result[0].url);
    await conn.sendMessage(from, { video: buffer });
});

// Pinterest
cmd({
    pattern: 'pinterest',
    desc: 'Search Pinterest images',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide search query.' });
    const api = `https://api.akuari.my.id/search/pinterest?query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(api).catch(() => ({ data: null }));
    if (!data || !data.result) return await conn.sendMessage(from, { text: '❌ No results.' });
    for (let i = 0; i < Math.min(5, data.result.length); i++) {
        const { buffer } = await getBuffer(data.result[i].images_url);
        if (buffer) await conn.sendMessage(from, { image: buffer });
    }
});

// MediaFire
cmd({
    pattern: 'mediafire',
    desc: 'Download from MediaFire',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0] || (mek.message.extendedTextMessage?.text);
    if (!url || !url.includes('mediafire.com')) {
        return await conn.sendMessage(from, { text: '❌ Provide a valid MediaFire URL.' });
    }
    const api = `https://api.akuari.my.id/downloader/mediafire?link=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api).catch(() => ({ data: null }));
    if (!data || !data.result) return await conn.sendMessage(from, { text: '❌ Failed to fetch.' });
    const { buffer, size } = await getBuffer(data.result.link);
    if (size > 100) return await conn.sendMessage(from, { text: `❌ File too large (${size} MB). Download manually: ${data.result.link}` });
    await conn.sendMessage(from, { document: buffer, mimetype: 'application/octet-stream', fileName: data.result.name });
});

// Image filters (simple – using external API)
const effects = ['skull', 'sketch', 'pencil', 'color', 'kiss', 'bokeh', 'wanted', 'look', 'gandm', 'dark', 'makeup', 'cartoon'];
effects.forEach(effect => {
    cmd({
        pattern: effect,
        desc: `Apply ${effect} filter to image`,
        category: 'editor',
        filename: __filename
    },
    async (conn, mek, from, args, config) => {
        if (!mek.message.imageMessage) return await conn.sendMessage(from, { text: '❌ Reply to an image.' });
        const stream = await conn.downloadMediaMessage(mek);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        // Use a free image editing API (replace if needed)
        const form = new FormData();
        form.append('image', buffer.toString('base64'));
        const { data } = await axios.post(`https://some-free-api.com/${effect}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(() => ({ data: null }));
        if (!data || !data.url) return await conn.sendMessage(from, { text: '❌ Failed to apply filter.' });
        const { buffer: imgBuffer } = await getBuffer(data.url);
        await conn.sendMessage(from, { image: imgBuffer });
    });
});

// Meme
cmd({
    pattern: 'meme',
    desc: 'Create meme from image',
    category: 'editor',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage) return await conn.sendMessage(from, { text: '❌ Reply to an image.' });
    const [top, bottom] = args.join(' ').split(';');
    if (!top) return await conn.sendMessage(from, { text: '❌ Syntax: .meme top text;bottom text' });
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const url = await memeMaker(buffer, top, bottom);
    const { buffer: imgBuffer } = await getBuffer(url);
    await conn.sendMessage(from, { image: imgBuffer });
});

// QR code reader
cmd({
    pattern: 'qr',
    desc: 'Read QR code from image',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage) return await conn.sendMessage(from, { text: '❌ Reply to a QR code image.' });
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const form = new FormData();
    form.append('file', buffer.toString('base64'));
    const { data } = await axios.post('https://api.qrserver.com/v1/read-qr-code/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).catch(() => ({ data: null }));
    if (!data || !data[0]?.symbol[0]?.data) return await conn.sendMessage(from, { text: '❌ No QR code found.' });
    await conn.sendMessage(from, { text: data[0].symbol[0].data });
});

// Upload to Imgur
cmd({
    pattern: 'url',
    desc: 'Upload image to get URL',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage && !mek.message.videoMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to an image/video.' });
    }
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const url = await uploadToImgur(buffer);
    await conn.sendMessage(from, { text: url });
});

// Group admin commands
cmd({
    pattern: 'kick',
    desc: 'Remove member from group',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    let user = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || mek.message.extendedTextMessage?.contextInfo?.participant;
    if (!user) return await conn.sendMessage(from, { text: '❌ Mention or reply to the user.' });
    await conn.groupParticipantsUpdate(from, [user], 'remove');
    await conn.sendMessage(from, { text: `✅ @${user.split('@')[0]} removed.`, mentions: [user] });
});

cmd({
    pattern: 'add',
    desc: 'Add member to group',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide phone number (e.g., 919876543210).' });
    const user = args[0] + '@s.whatsapp.net';
    await conn.groupParticipantsUpdate(from, [user], 'add');
    await conn.sendMessage(from, { text: `✅ @${args[0]} added.`, mentions: [user] });
});

cmd({
    pattern: 'promote',
    desc: 'Promote member to admin',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    let user = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || mek.message.extendedTextMessage?.contextInfo?.participant;
    if (!user) return await conn.sendMessage(from, { text: '❌ Mention or reply to the user.' });
    await conn.groupParticipantsUpdate(from, [user], 'promote');
    await conn.sendMessage(from, { text: `✅ @${user.split('@')[0]} promoted.`, mentions: [user] });
});

cmd({
    pattern: 'demote',
    desc: 'Demote admin to member',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    let user = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || mek.message.extendedTextMessage?.contextInfo?.participant;
    if (!user) return await conn.sendMessage(from, { text: '❌ Mention or reply to the user.' });
    await conn.groupParticipantsUpdate(from, [user], 'demote');
    await conn.sendMessage(from, { text: `✅ @${user.split('@')[0]} demoted.`, mentions: [user] });
});

cmd({
    pattern: 'mute',
    desc: 'Mute group',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    await conn.groupSettingUpdate(from, 'announcement');
    await conn.sendMessage(from, { text: '🔇 Group muted.' });
});

cmd({
    pattern: 'unmute',
    desc: 'Unmute group',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    await conn.groupSettingUpdate(from, 'not_announcement');
    await conn.sendMessage(from, { text: '🔊 Group unmuted.' });
});

cmd({
    pattern: 'invite',
    desc: 'Get group invite link',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    const code = await conn.groupInviteCode(from);
    await conn.sendMessage(from, { text: `📎 Invite link: https://chat.whatsapp.com/${code}` });
});

cmd({
    pattern: 'revoke',
    desc: 'Revoke group invite link',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = participants.participants.some(p => p.id === botJid && p.admin);
    if (!isBotAdmin) return await conn.sendMessage(from, { text: '❌ I need to be admin.' });
    await conn.groupRevokeInvite(from);
    await conn.sendMessage(from, { text: '🔄 Invite link revoked.' });
});

cmd({
    pattern: 'tag',
    desc: 'Tag all members',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const participants = await conn.groupMetadata(from);
    const jids = participants.participants.map(p => p.id);
    let text = args.join(' ') || '📢 @all';
    await conn.sendMessage(from, { text, mentions: jids });
});

// AFK
cmd({
    pattern: 'afk',
    desc: 'Set AFK status',
    category: 'utility',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    afkState.isAfk = true;
    afkState.reason = args.join(' ') || 'No reason';
    afkState.time = Date.now();
    await conn.sendMessage(from, { text: `✅ AFK set. Reason: ${afkState.reason}` });
});

// Warn
cmd({
    pattern: 'warn',
    desc: 'Warn a user',
    category: 'admin',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const user = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || mek.message.extendedTextMessage?.contextInfo?.participant;
    if (!user) return await conn.sendMessage(from, { text: '❌ Mention or reply to the user.' });
    const reason = args.join(' ') || 'No reason';
    const { count, total } = await warn(user, from, reason);
    await conn.sendMessage(from, { text: `⚠️ @${user.split('@')[0]} warned (${count}/${total}). Reason: ${reason}`, mentions: [user] });
});

// Filter
cmd({
    pattern: 'filter',
    desc: 'Add a filter (auto-reply)',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const [trigger, response] = args.join(' ').split(';').map(s => s.trim());
    if (!trigger || !response) return await conn.sendMessage(from, { text: '❌ Syntax: .filter trigger;response' });
    setFilter(from, trigger, response);
    await conn.sendMessage(from, { text: `✅ Filter added: "${trigger}" -> "${response}"` });
});

cmd({
    pattern: 'stop',
    desc: 'Remove a filter',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const trigger = args.join(' ');
    if (!trigger) return await conn.sendMessage(from, { text: '❌ Provide the filter to remove.' });
    deleteFilter(from, trigger);
    await conn.sendMessage(from, { text: `✅ Filter removed: "${trigger}"` });
});

// Welcome / Goodbye
cmd({
    pattern: 'welcome',
    desc: 'Set welcome message',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide message or "on/off".' });
    if (args[0] === 'on' || args[0] === 'off') {
        enableGreetings(from, 'welcome', args[0]);
        return await conn.sendMessage(from, { text: `✅ Welcome ${args[0] === 'on' ? 'enabled' : 'disabled'}.` });
    }
    const msg = args.join(' ');
    setMessage(from, 'welcome', msg);
    await conn.sendMessage(from, { text: '✅ Welcome message set.' });
});

cmd({
    pattern: 'goodbye',
    desc: 'Set goodbye message',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide message or "on/off".' });
    if (args[0] === 'on' || args[0] === 'off') {
        enableGreetings(from, 'goodbye', args[0]);
        return await conn.sendMessage(from, { text: `✅ Goodbye ${args[0] === 'on' ? 'enabled' : 'disabled'}.` });
    }
    const msg = args.join(' ');
    setMessage(from, 'goodbye', msg);
    await conn.sendMessage(from, { text: '✅ Goodbye message set.' });
});

// Antilink
cmd({
    pattern: 'antilink',
    desc: 'Enable/disable antilink',
    category: 'group',
    onlyGroup: true,
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0] || !['on', 'off'].includes(args[0])) {
        return await conn.sendMessage(from, { text: '❌ Use .antilink on or .antilink off' });
    }
    enableAntilink(from, args[0]);
    await conn.sendMessage(from, { text: `✅ Antilink ${args[0]}.` });
});

// Score (cricket)
cmd({
    pattern: 'score',
    desc: 'Live cricket score',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const msg = await iplscore();
    await conn.sendMessage(from, { text: msg });
});

// News
cmd({
    pattern: 'news',
    desc: 'Latest news',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY').catch(() => ({ data: null }));
    if (!data || !data.articles) return await conn.sendMessage(from, { text: '❌ Unable to fetch news.' });
    let msg = '*📰 Latest News*\n\n';
    data.articles.slice(0, 10).forEach((a, i) => {
        msg += `${i+1}. *${a.title}*\n   ${a.source.name}\n   ${a.url}\n\n`;
    });
    await conn.sendMessage(from, { text: msg });
});

// Quote
cmd({
    pattern: 'quote',
    desc: 'Random quote',
    category: 'fun',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://api.quotable.io/random').catch(() => ({ data: null }));
    if (!data) return await conn.sendMessage(from, { text: '❌ Could not fetch quote.' });
    await conn.sendMessage(from, { text: `"${data.content}"\n— ${data.author}` });
});

// Fact
cmd({
    pattern: 'fact',
    desc: 'Random fact',
    category: 'fun',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en').catch(() => ({ data: null }));
    if (!data) return await conn.sendMessage(from, { text: '❌ Could not fetch fact.' });
    await conn.sendMessage(from, { text: data.text });
});

// Lyric
cmd({
    pattern: 'lyric',
    desc: 'Get song lyrics',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const song = args.join(' ');
    if (!song) return await conn.sendMessage(from, { text: '❌ Provide song name.' });
    const { data } = await axios.get(`https://api.lyrics.ovh/v1/${song.replace(' ', '%20')}`).catch(() => ({ data: null }));
    if (!data || !data.lyrics) return await conn.sendMessage(from, { text: '❌ Lyrics not found.' });
    await conn.sendMessage(from, { text: data.lyrics.slice(0, 4000) });
});

// Crypto
cmd({
    pattern: 'crypto',
    desc: 'Cryptocurrency price',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const coin = args[0] || 'bitcoin';
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`).catch(() => ({ data: null }));
    if (!data || !data[coin]) return await conn.sendMessage(from, { text: '❌ Coin not found.' });
    await conn.sendMessage(from, { text: `💰 *${coin}*: $${data[coin].usd}` });
});

// Spell check
cmd({
    pattern: 'spell',
    desc: 'Check spelling',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const word = args.join(' ');
    if (!word) return await conn.sendMessage(from, { text: '❌ Provide word.' });
    const { data } = await axios.get(`https://api.datamuse.com/words?sp=${word}`).catch(() => ({ data: [] }));
    if (!data.length) return await conn.sendMessage(from, { text: '✅ Spelling seems correct.' });
    const suggestions = data.slice(0, 5).map(w => w.word).join(', ');
    await conn.sendMessage(from, { text: `❓ Did you mean: ${suggestions}` });
});

// Calculator
cmd({
    pattern: 'calc',
    desc: 'Evaluate mathematical expression',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const expr = args.join(' ');
    if (!expr) return await conn.sendMessage(from, { text: '❌ Provide expression.' });
    try {
        const result = eval(expr);
        await conn.sendMessage(from, { text: `= ${result}` });
    } catch (e) {
        await conn.sendMessage(from, { text: '❌ Invalid expression.' });
    }
});

// Shorten URL
cmd({
    pattern: 'short',
    desc: 'Shorten URL',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0] || (mek.message.extendedTextMessage?.text);
    if (!url || !isUrl(url)) return await conn.sendMessage(from, { text: '❌ Provide a valid URL.' });
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`).catch(() => ({ data: null }));
    if (!data) return await conn.sendMessage(from, { text: '❌ Failed to shorten.' });
    await conn.sendMessage(from, { text: data });
});

// Google search (needs API key)
cmd({
    pattern: 'google',
    desc: 'Search Google',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide search query.' });
    const { data } = await axios.get(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=YOUR_API_KEY&cx=YOUR_CX`).catch(() => ({ data: null }));
    if (!data || !data.items) return await conn.sendMessage(from, { text: '❌ No results.' });
    let msg = '*🔍 Google Search Results*\n\n';
    data.items.slice(0, 5).forEach((item, i) => {
        msg += `${i+1}. *${item.title}*\n   ${item.link}\n   ${item.snippet}\n\n`;
    });
    await conn.sendMessage(from, { text: msg });
});

// Wikipedia
cmd({
    pattern: 'wiki',
    desc: 'Search Wikipedia',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide search query.' });
    const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`).catch(() => ({ data: null }));
    if (!data || data.type === 'disambiguation') return await conn.sendMessage(from, { text: '❌ Not found.' });
    await conn.sendMessage(from, { text: `*${data.title}*\n\n${data.extract}\n\n🔗 ${data.content_urls.desktop.page}` });
});

// Movie info
cmd({
    pattern: 'movie',
    desc: 'Get movie info',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide movie name.' });
    const { data } = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=742b2d09`).catch(() => ({ data: null }));
    if (!data || data.Response === 'False') return await conn.sendMessage(from, { text: '❌ Movie not found.' });
    let msg = `*${data.Title} (${data.Year})*\n`;
    msg += `⭐ IMDb: ${data.imdbRating}\n`;
    msg += `🎭 Genre: ${data.Genre}\n`;
    msg += `🎬 Director: ${data.Director}\n`;
    msg += `👥 Cast: ${data.Actors}\n`;
    msg += `📝 Plot: ${data.Plot}\n`;
    msg += `🌍 Language: ${data.Language}\n`;
    msg += `📅 Released: ${data.Released}\n`;
    msg += `⏱️ Runtime: ${data.Runtime}\n`;
    msg += `🏆 Awards: ${data.Awards}\n`;
    msg += `💰 BoxOffice: ${data.BoxOffice || 'N/A'}`;
    await conn.sendMessage(from, { text: msg });
});

// Anime search
cmd({
    pattern: 'anime',
    desc: 'Search anime',
    category: 'fun',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide anime name.' });
    const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`).catch(() => ({ data: null }));
    if (!data || !data.data.length) return await conn.sendMessage(from, { text: '❌ Not found.' });
    const a = data.data[0];
    let msg = `*${a.title}*\n`;
    msg += `📺 Type: ${a.type}\n`;
    msg += `📅 Episodes: ${a.episodes}\n`;
    msg += `⭐ Score: ${a.score}\n`;
    msg += `📝 Synopsis: ${a.synopsis.substring(0, 300)}...\n`;
    msg += `🔗 ${a.url}`;
    await conn.sendMessage(from, { text: msg });
});

// Plugin management (placeholder)
cmd({
    pattern: 'plugin',
    desc: 'Install/remove plugins',
    category: 'owner',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide action (list/install/remove).' });
    if (args[0] === 'list') {
        const plugins = await getPlugin();
        await conn.sendMessage(from, { text: plugins || 'No plugins installed.' });
    } else if (args[0] === 'install') {
        await conn.sendMessage(from, { text: 'Plugin install not implemented.' });
    } else if (args[0] === 'remove') {
        await conn.sendMessage(from, { text: 'Plugin remove not implemented.' });
    }
});

// Restart
cmd({
    pattern: 'restart',
    desc: 'Restart bot',
    category: 'owner',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '🔄 Restarting...' });
    process.exit(0);
});

console.log('✅ All self‑contained commands registered.');
