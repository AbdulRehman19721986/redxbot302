const { cmd } = require('../command');

// Generate 100 simple commands (ping0 to ping99)
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

// Add some useful commands
cmd({
    pattern: 'menu',
    desc: 'Show bot menu',
    category: 'main',
    filename: __filename,
},
async (conn, mek, from, args, config) => {
    let menuText = `╭─〔 *${config.BOT_NAME} MENU* 〕\n`;
    menuText += `├─ Prefix: ${config.PREFIX}\n`;
    menuText += `├─ Owner: ${config.OWNER_NAME}\n`;
    menuText += `├─ Mode: ${config.MODE}\n`;
    menuText += `╰──────────────\n\n`;
    menuText += `*Available Commands:*\n`;
    menuText += commands.map(c => `${config.PREFIX}${c.pattern} – ${c.desc}`).join('\n');
    await conn.sendMessage(from, { text: menuText });
});

cmd({
    pattern: 'owner',
    desc: 'Show owner contact',
    category: 'main',
    filename: __filename,
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
    filename: __filename,
},
async (conn, mek, from, args, config) => {
    await conn.sendMessage(from, { text: config.LIVE_MSG || 'I am alive!' });
});
