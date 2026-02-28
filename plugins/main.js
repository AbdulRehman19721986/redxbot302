import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBuffer, getJson, TiktokDownloader, igStory, instagram, mediaFire, pinterest, twitter } from '../Utilis/download.js';
import { removeBg } from '../Utilis/removebg.js';
import { sticker, webpToMp4, addExif, addAudioMetaData, getFfmpegBuffer } from '../Utilis/fFmpeg.js';
import { isUrl, parsedJid, checkImAdmin, genButtons, generateListMessage, newsListMessage, SpeachToText, uploadToImgur } from '../Utilis/Misc.js';
import { getMessage, setMessage, deleteMessage, enableGreetings, enableAntilink, enableAntiFake, enableAntiBad } from '../Utilis/greetings.js';
import { getFilter, setFilter, deleteFilter } from '../Utilis/filters.js';
import { warn, getEachWarn } from '../Utilis/warn.js';
import { setSchedule, getSchedule, getEachSchedule } from '../Utilis/schedule.js';
import { getMute, setMute, getUnmute, setUnmute } from '../Utilis/groupmute.js';
import { lydia, getLydia, setLydia } from '../Utilis/lydia.js';
import { iplscore } from '../Utilis/Misc.js';
import { getName } from '../Utilis/download.js';
import { memeMaker } from '../Utilis/meme.js';
import { photoEditor } from '../Utilis/editors.js';
import { installPlugin, getPlugin, deletePlugin } from '../Utilis/plugins.js';

const __filename = fileURLToPath(import.meta.url);
console.log('🔥 REDXBOT302 – All commands loaded.');

// ==================== BASIC COMMANDS ====================
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

// ==================== STICKER COMMANDS ====================
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

cmd({
    pattern: 'take',
    desc: 'Change sticker pack name',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.sticker) return await conn.sendMessage(from, { text: '❌ Reply to a sticker.' });
    const pack = args.join(' ') || config.STICKER_NAME;
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const sticker = await addExif(buffer, pack);
    await conn.sendMessage(from, { sticker: sticker });
});

cmd({
    pattern: 'toimage',
    desc: 'Convert sticker to image',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.sticker) return await conn.sendMessage(from, { text: '❌ Reply to a sticker.' });
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const image = await getFfmpegBuffer(buffer, 'image.png', 'photo');
    await conn.sendMessage(from, { image: image });
});

cmd({
    pattern: 'tomp4',
    desc: 'Convert animated sticker to video',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.sticker || !mek.message.sticker.isAnimated) {
        return await conn.sendMessage(from, { text: '❌ Reply to an animated sticker.' });
    }
    const stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const video = await webpToMp4(buffer);
    await conn.sendMessage(from, { video: video });
});

// ==================== TTS & TRANSLATE ====================
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
    if (text.startsWith('{')) {
        const match = text.match(/^\{([a-z]{2})\}(.*)/);
        if (match) {
            lang = match[1];
            text = match[2].trim();
        }
    }
    const audio = await SpeachToText(lang, text);
    await conn.sendMessage(from, { audio: audio, mimetype: 'audio/mp4', ptt: true });
});

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

// ==================== WEATHER ====================
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

// ==================== YOUTUBE ====================
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

// ==================== INSTAGRAM ====================
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
    await conn.sendMessage(from, { text: '⏳ Fetching...' });
    const urls = await instagram(url);
    if (!urls) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    for (const mediaUrl of urls) {
        const { buffer, type } = await getBuffer(mediaUrl);
        if (type === 'image') await conn.sendMessage(from, { image: buffer });
        else await conn.sendMessage(from, { video: buffer });
    }
});

cmd({
    pattern: 'story',
    desc: 'Download Instagram story',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    let username = args[0] || (mek.message.extendedTextMessage?.text);
    if (!username) return await conn.sendMessage(from, { text: '❌ Provide Instagram username.' });
    if (username.includes('/')) username = username.split('/stories/')[1]?.split('/')[0] || username;
    await conn.sendMessage(from, { text: '⏳ Fetching stories...' });
    const stories = await igStory(username);
    if (!stories || !stories.length) return await conn.sendMessage(from, { text: '❌ No stories found.' });
    for (const url of stories) {
        const { buffer, type } = await getBuffer(url);
        if (type === 'image') await conn.sendMessage(from, { image: buffer });
        else await conn.sendMessage(from, { video: buffer });
    }
});

// ==================== TIKTOK ====================
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
    await conn.sendMessage(from, { text: '⏳ Downloading...' });
    const link = await TiktokDownloader(url);
    if (!link) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    const { buffer } = await getBuffer(link);
    await conn.sendMessage(from, { video: buffer });
});

// ==================== TWITTER ====================
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
    await conn.sendMessage(from, { text: '⏳ Fetching...' });
    const urls = await twitter(url);
    if (!urls) return await conn.sendMessage(from, { text: '❌ Failed to download.' });
    const { buffer } = await getBuffer(urls[0]);
    await conn.sendMessage(from, { video: buffer });
});

// ==================== PINTEREST ====================
cmd({
    pattern: 'pinterest',
    desc: 'Download Pinterest images',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const query = args.join(' ');
    if (!query) return await conn.sendMessage(from, { text: '❌ Provide search query.' });
    await conn.sendMessage(from, { text: '⏳ Searching...' });
    const urls = await pinterest(query);
    if (!urls || !urls.length) return await conn.sendMessage(from, { text: '❌ No results.' });
    for (let i = 0; i < Math.min(5, urls.length); i++) {
        const { buffer, type } = await getBuffer(urls[i]);
        if (type === 'image') await conn.sendMessage(from, { image: buffer });
    }
});

// ==================== MEDIAFIRE ====================
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
    await conn.sendMessage(from, { text: '⏳ Fetching...' });
    const { link, title } = await mediaFire(url);
    if (!link) return await conn.sendMessage(from, { text: '❌ Failed to fetch.' });
    const { buffer, type, size, mime } = await getBuffer(link);
    if (size > 100) return await conn.sendMessage(from, { text: `❌ File too large (${size} MB). Download manually: ${link}` });
    await conn.sendMessage(from, { document: buffer, mimetype: mime, fileName: title });
});

// ==================== IMAGE EDITING ====================
// Separate commands for each effect
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
        const location = await conn.downloadMediaMessage(mek);
        const { status, result } = await photoEditor(location, effect);
        if (!status) return await conn.sendMessage(from, { text: `❌ Failed: ${result}` });
        const { buffer } = await getBuffer(result);
        await conn.sendMessage(from, { image: buffer });
    });
});

// ==================== MEME ====================
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
    const location = await conn.downloadMediaMessage(mek);
    const output = await memeMaker(location, top, bottom);
    await conn.sendMessage(from, { image: output });
});

// ==================== QR CODE ====================
cmd({
    pattern: 'qr',
    desc: 'Read QR code from image',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage) return await conn.sendMessage(from, { text: '❌ Reply to a QR code image.' });
    const location = await conn.downloadMediaMessage(mek);
    const { data } = await axios.post('https://api.qrserver.com/v1/read-qr-code/', { file: location }, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).catch(() => ({ data: null }));
    if (!data || !data[0]?.symbol[0]?.data) return await conn.sendMessage(from, { text: '❌ No QR code found.' });
    await conn.sendMessage(from, { text: data[0].symbol[0].data });
});

// ==================== URL UPLOAD ====================
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
    const location = await conn.downloadMediaMessage(mek);
    const url = await uploadToImgur(location);
    await conn.sendMessage(from, { text: url });
});

// ==================== REMOVE BG ====================
cmd({
    pattern: 'removebg',
    desc: 'Remove image background',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage) return await conn.sendMessage(from, { text: '❌ Reply to an image.' });
    const location = await conn.downloadMediaMessage(mek);
    const buffer = await removeBg(location, config.REMOVEBG_KEY);
    if (typeof buffer === 'string') return await conn.sendMessage(from, { text: buffer });
    await conn.sendMessage(from, { image: buffer });
});

// ==================== GROUP ADMIN COMMANDS ====================
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

// ==================== TAG ALL ====================
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

// ==================== AFK ====================
let afkState = { isAfk: false, reason: '', time: 0 };
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

// ==================== WARN ====================
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

// ==================== FILTERS ====================
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
    await setFilter(from, trigger, response);
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
    await deleteFilter(from, trigger);
    await conn.sendMessage(from, { text: `✅ Filter removed: "${trigger}"` });
});

// ==================== WELCOME/GOODBYE ====================
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
        await enableGreetings(from, 'welcome', args[0]);
        return await conn.sendMessage(from, { text: `✅ Welcome ${args[0] === 'on' ? 'enabled' : 'disabled'}.` });
    }
    const msg = args.join(' ');
    await setMessage(from, 'welcome', msg);
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
        await enableGreetings(from, 'goodbye', args[0]);
        return await conn.sendMessage(from, { text: `✅ Goodbye ${args[0] === 'on' ? 'enabled' : 'disabled'}.` });
    }
    const msg = args.join(' ');
    await setMessage(from, 'goodbye', msg);
    await conn.sendMessage(from, { text: '✅ Goodbye message set.' });
});

// ==================== ANTILINK ====================
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
    await enableAntilink(from, args[0]);
    await conn.sendMessage(from, { text: `✅ Antilink ${args[0]}.` });
});

// ==================== SCORE (CRICKET) ====================
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

// ==================== NEWS ====================
cmd({
    pattern: 'news',
    desc: 'Latest news',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://newsapi.org/v2/top-headlines?country=in&apiKey=YOUR_API_KEY').catch(() => ({ data: null }));
    if (!data || !data.articles) return await conn.sendMessage(from, { text: '❌ Unable to fetch news.' });
    let msg = '*📰 Latest News*\n\n';
    data.articles.slice(0, 10).forEach((a, i) => {
        msg += `${i+1}. *${a.title}*\n   ${a.source.name}\n   ${a.url}\n\n`;
    });
    await conn.sendMessage(from, { text: msg });
});

// ==================== QUOTE ====================
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

// ==================== FACT ====================
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

// ==================== LYRIC ====================
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

// ==================== CRYPTO ====================
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

// ==================== SPELL CHECK ====================
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

// ==================== CALC ====================
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

// ==================== SHORT URL ====================
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

// ==================== GOOGLE SEARCH ====================
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

// ==================== WIKIPEDIA ====================
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

// ==================== MOVIE ====================
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

// ==================== ANIME ====================
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

// ==================== PLUGIN MANAGEMENT ====================
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
        if (!args[1]) return await conn.sendMessage(from, { text: '❌ Provide URL.' });
        await installPlugin(args[1], 'plugin.js');
        await conn.sendMessage(from, { text: '✅ Plugin installed. Restart bot.' });
    } else if (args[0] === 'remove') {
        if (!args[1]) return await conn.sendMessage(from, { text: '❌ Provide plugin name.' });
        await deletePlugin(args[1]);
        await conn.sendMessage(from, { text: '✅ Plugin removed. Restart bot.' });
    }
});

// ==================== HEROKU MANAGEMENT ====================
cmd({
    pattern: 'restart',
    desc: 'Restart bot (Heroku)',
    category: 'owner',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '🔄 Restarting...' });
    process.exit(0); // Works on Railway too; will restart by platform
});

// ==================== END ====================
console.log('✅ All commands registered.');
