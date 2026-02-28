import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import ytSearch from 'yt-search';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __filename = fileURLToPath(import.meta.url);
console.log('📦 Main plugin loaded.');

// -------------------------------------------------------------------
// Simple ping command (always available)
// -------------------------------------------------------------------
cmd({
    pattern: 'ping',
    desc: 'Simple ping command',
    category: 'utility',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: 'Pong!' });
});

// -------------------------------------------------------------------
// 100 TEST COMMANDS (ping0 to ping99)
// -------------------------------------------------------------------
for (let i = 0; i < 100; i++) {
    cmd({
        pattern: `ping${i}`,
        desc: `Test command ${i}`,
        category: 'test',
        filename: __filename,
    },
    async (conn, mek, from, args, config) => {
        await conn.sendMessage(from, { text: `Pong ${i}!` });
    });
}

// -------------------------------------------------------------------
// MAIN COMMANDS
// -------------------------------------------------------------------

// .play – YouTube audio downloader (sends info)
cmd({
    pattern: 'play',
    desc: 'Download audio from YouTube',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a song name.' });
    const query = args.join(' ');
    try {
        const { videos } = await ytSearch(query);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results found.' });
        const video = videos[0];
        const url = video.url;
        await conn.sendMessage(from, { text: `🎵 *Title:* ${video.title}\n📎 *Link:* ${url}\n⏱️ *Duration:* ${video.timestamp}` });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Error fetching video.' });
    }
});

// .video – YouTube video downloader (sends info)
cmd({
    pattern: 'video',
    desc: 'Download video from YouTube',
    category: 'downloader',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a video name.' });
    const query = args.join(' ');
    try {
        const { videos } = await ytSearch(query);
        if (!videos.length) return await conn.sendMessage(from, { text: '❌ No results found.' });
        const video = videos[0];
        const url = video.url;
        await conn.sendMessage(from, { text: `🎬 *Title:* ${video.title}\n📎 *Link:* ${url}\n⏱️ *Duration:* ${video.timestamp}` });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Error fetching video.' });
    }
});

// .ai – AI Chat (using a free API)
cmd({
    pattern: 'ai',
    desc: 'Chat with AI',
    category: 'ai',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Please provide a message.' });
    const prompt = args.join(' ');
    try {
        const { data } = await axios.get(`https://api.akuari.my.id/ai/gpt?text=${encodeURIComponent(prompt)}`);
        const reply = data.respon || data.message || 'No response';
        await conn.sendMessage(from, { text: reply });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ AI service unavailable.' });
    }
});

// .sticker – Create sticker from image/video
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

// .owner – Show owner contact
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

// .setpp – Change bot profile picture (owner only)
cmd({
    pattern: 'setpp',
    desc: 'Change bot profile picture',
    category: 'owner',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const sender = mek.key.participant || mek.key.remoteJid;
    if (sender !== config.OWNER_NUMBER + '@s.whatsapp.net') {
        return await conn.sendMessage(from, { text: '❌ Only owner can use this command.' });
    }
    if (!mek.message.imageMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to an image.' });
    }
    let stream = await conn.downloadMediaMessage(mek);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    try {
        await conn.updateProfilePicture(conn.user.id, buffer);
        await conn.sendMessage(from, { text: '✅ Profile picture updated.' });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Failed to update profile picture.' });
    }
});

// .features – Show bot features table
cmd({
    pattern: 'features',
    desc: 'Show bot features',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const features = `╔════════════════════════╗
║   ⚒️ *BOT FEATURES* ⚒️   ║
╚════════════════════════╝

🤖 *Ultimate Work* ➜ ✅ Active
🔁 *Anti-Delete* ➜ ✅ Active
🎵 *24/7 Runtime* ➜ ✅ Active
📥 *Downloader* ➜ ✅ Active
🧠 *AI Chat* ➜ ✅ Active
👮 *Group Setting* ➜ ✅ Active
📛 *Auto Sticker* ➜ ✅ Active
🎮 *Games* ➜ ✅ Active
🌐 *Web Pairing* ➜ ✅ Active
🎨 *Sticker Maker* ➜ ✅ Active

✨ *And many more...* ✨`;
    await conn.sendMessage(from, { text: features });
});

// .menu – Show all commands grouped by category
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

// .alive – Check bot status
cmd({
    pattern: 'alive',
    desc: 'Check bot status',
    category: 'main',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: config.LIVE_MSG || 'I am alive!' });
});
