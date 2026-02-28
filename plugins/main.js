import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __filename = fileURLToPath(import.meta.url);
console.log('🔥 REDXBOT302 – All commands loaded.');

// ==================== UTILITY ====================
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + (s ? s + 's' : '');
}

let botMode = 'public'; // default

// ==================== COMMANDS ====================

cmd({
    pattern: 'test',
    desc: 'Test command',
    category: 'debug',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: '✅ Test works!' });
});

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

    const uptime = process.uptime();
    const runtimeStr = runtime(uptime);

    let menuText = `╭┈───〔 *${config.BOT_NAME}* 〕┈───⊷\n`;
    menuText += `├▢ 🇵🇸 Owner: ${config.OWNER_NAME}\n`;
    menuText += `├▢ 🪄 Prefix: ${config.PREFIX}\n`;
    menuText += `├▢ 🎐 Version: 4.5.0\n`;
    menuText += `├▢ ☁️ Platform: Railway\n`;
    menuText += `├▢ 📜 Plugins: ${commands.length}\n`;
    menuText += `├▢ ⏰ Runtime: ${runtimeStr}\n`;
    menuText += `╰───────────────────⊷\n`;
    menuText += `╭───⬡ *SELECT MENU* ⬡───\n`;

    const sortedCategories = Object.keys(categories).sort();
    sortedCategories.forEach((cat, index) => {
        menuText += `┋ ⬡ ${index+1} ${cat.toUpperCase()} MENU\n`;
    });
    menuText += `╰───────────────────⊷\n`;
    menuText += `\n🔗 *Important Links:*\n`;
    menuText += `• GitHub: https://github.com/AbdulRehman19721986/REDXBOT-MD\n`;
    menuText += `• WhatsApp Channel: https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10\n`;
    menuText += `• Telegram: https://t.me/TeamRedxhacker2\n`;
    menuText += `• YouTube: https://youtube.com/@rootmindtech\n`;
    menuText += `\n✨ *Thank you for using REDXBOT!* ✨`;

    await conn.sendMessage(from, { text: menuText });
});

cmd({
    pattern: 'repo',
    desc: 'Show repository info',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const repoMsg = `╭─〔 *${config.BOT_NAME} REPOSITORY* 〕\n│\n├─ 📌 Repository Name: REDXBOT-MD\n├─ 👑 Owner: Abdul Rehman Rajpoot\n├─ ⭐ Stars: 100+\n├─ ⑂ Forks: 50+\n├─ 📝 Description: A powerful WhatsApp bot with 60+ features\n│\n├─ 🔗 GitHub Link:\n│   https://github.com/AbdulRehman19721986/REDXBOT-MD\n│\n├─ 🤖 Pair Link:\n│   http://redxpair.gt.tc\n│\n├─ 🌐 Join Channel:\n│   https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10\n╰───────────────────⊷`;
    await conn.sendMessage(from, { text: repoMsg });
});

cmd({
    pattern: 'mode',
    desc: 'Change bot mode (public/private)',
    category: 'owner',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const newMode = args[0];
    if (!newMode || !['public', 'private'].includes(newMode)) {
        return await conn.sendMessage(from, { text: '❌ Usage: .mode public or .mode private' });
    }
    botMode = newMode;
    await conn.sendMessage(from, { text: `✅ Bot mode is now set to *${newMode.toUpperCase()}*.` });
});

cmd({
    pattern: 'sticker',
    alias: ['s'],
    desc: 'Create sticker from image/video',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!mek.message.imageMessage && !mek.message.videoMessage) {
        return await conn.sendMessage(from, { text: '❌ Reply to an image or video.' });
    }
    const stream = await conn.downloadMediaMessage(mek);
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
    pattern: 'tts',
    desc: 'Text to speech',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide text.' });
    const text = args.join(' ');
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
});

cmd({
    pattern: 'weather',
    desc: 'Get weather info',
    category: 'info',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide city name.' });
    const city = args.join(' ');
    try {
        const { data } = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
        const msg = `*Weather in ${data.name}, ${data.sys.country}*\n🌡️ Temp: ${data.main.temp}°C\n☁️ ${data.weather[0].description}\n💧 Humidity: ${data.main.humidity}%\n💨 Wind: ${data.wind.speed} m/s`;
        await conn.sendMessage(from, { text: msg });
    } catch {
        await conn.sendMessage(from, { text: '❌ City not found.' });
    }
});

cmd({
    pattern: 'quote',
    desc: 'Random quote',
    category: 'fun',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://api.quotable.io/random');
    await conn.sendMessage(from, { text: `"${data.content}"\n— ${data.author}` });
});

cmd({
    pattern: 'fact',
    desc: 'Random fact',
    category: 'fun',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
    await conn.sendMessage(from, { text: data.text });
});

cmd({
    pattern: 'calc',
    desc: 'Calculate expression',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    try {
        const result = eval(args.join(' '));
        await conn.sendMessage(from, { text: `= ${result}` });
    } catch {
        await conn.sendMessage(from, { text: '❌ Invalid expression.' });
    }
});

cmd({
    pattern: 'short',
    desc: 'Shorten URL',
    category: 'tools',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    const url = args[0];
    if (!url) return await conn.sendMessage(from, { text: '❌ Provide URL.' });
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await conn.sendMessage(from, { text: data });
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
    category: 'main',
    filename: __filename
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: config.LIVE_MSG || 'I am alive!' });
});

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

// Group admin commands (add more as needed)
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
    if (!args[0]) return await conn.sendMessage(from, { text: '❌ Provide phone number.' });
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

console.log('✅ All commands registered.');
