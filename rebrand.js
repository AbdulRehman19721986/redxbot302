const fs = require('fs');
const path = require('path');

// ==================== LOAD BRAND DATA FROM datamain.txt ====================
const datamainPath = path.join(__dirname, 'datamain.txt');
if (!fs.existsSync(datamainPath)) {
    console.error('❌ datamain.txt not found!');
    process.exit(1);
}
const datamainContent = fs.readFileSync(datamainPath, 'utf8');

function extract(pattern) {
    const match = datamainContent.match(pattern);
    return match ? match[1].trim() : '';
}

const brand = {
    ownerName: extract(/ownername\s+(.+)/i) || 'Abdul Rehman Rajpoot',
    secondOwner: extract(/second ownername\s+(.+)/i) || 'Muzamil Khan',
    ownerNumber: extract(/watsapp number owner number\s+([+\d]+)/i) || '61468259338',
    muzamilNumber: extract(/watsappnumber:muzamil khan;\+?(\d+)/i) || '923183928892',
    whatsappGroup: extract(/watsapp group\s+(https?.+)/i) || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo',
    githubRepo: extract(/botgithub\s+(https?.+)/i) || 'https://github.com/AbdulRehman19721986/redxbot302',
    githubMain: extract(/\* GitHub:\s+(https?.+)/i) || 'https://github.com/AbdulRehman19721986/REDXBOT-MD',
    whatsappChannel: extract(/\* WhatsApp Channel:\s+(https?.+)/i) || 'https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10',
    telegramGroup: extract(/\* Telegram Group:\s+(https?.+)/i) || 'https://t.me/TeamRedxhacker2',
    youtube: extract(/\* YouTube:\s+(https?.+)/i) || 'https://youtube.com/@rootmindtech',
    botDp: extract(/botdp image\s+(https?.+)/i) || 'https://files.catbox.moe/s36b12.jpg',
    channelJid: extract(/my group news letter id\s*=\s*([^\s]+)/i) || '120363405513439052@newsletter',
};

// ==================== REPLACEMENT RULES ====================
const REPLACEMENTS = [
    // Names
    ['GlobalTechInfo', brand.ownerName.replace(/\s+/g, '')],
    ['Qasim Ali', `${brand.ownerName} & ${brand.secondOwner}`],
    ['MEGA-MD', 'REDXBOT302'],
    ['MEGA MD', 'REDXBOT302'],
    ['MEGA PRO', 'REDXBOT302'],
    ['GlobalTechBots', 'TeamRedxhacker2'],

    // Numbers
    ['923000000000', brand.ownerNumber],
    ['923051391007', brand.ownerNumber],
    ['923306137477', brand.ownerNumber],
    ['923051391005', brand.ownerNumber],

    // URLs
    ['https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07', brand.whatsappChannel],
    ['https://t.me/Global_TechInfo', brand.telegramGroup],
    ['https://t.me/GlobalTechBots', brand.telegramGroup],
    ['https://youtube.com/@GlobalTechInfo', brand.youtube],
    ['https://github.com/GlobalTechInfo/MEGA-MD', brand.githubMain],
    ['https://github.com/GlobalTechInfo', brand.githubMain.replace(/\/[^/]+$/, '')],
    ['https://github.com/AbdulRehman19721986/REDXBOT-MD', brand.githubMain],
    ['https://github.com/AbdulRehman19721986/redxbot302', brand.githubRepo],

    // Newsletter JID
    ['120363319098372999@newsletter', brand.channelJid],

    // Channel name in newsletterInfo
    ["newsletterName: 'MEGA MD'", "newsletterName: 'REDXBOT302'"],
    ['newsletterName: "MEGA MD"', 'newsletterName: "REDXBOT302"'],

    // Profile picture
    ['https://image2url.com/r2/default/images/1772252008593-2690797c-4bd7-431e-b1f7-0f6ea21f7320.jpg', brand.botDp],
    ['https://i.postimg.cc/LXCqjXmt/1765653734695.jpg', brand.botDp],
];

const NEW_HEADER = `/*****************************************************************************
 *                                                                           *
 *                     Developed By ${brand.ownerName}                     *
 *                     & ${brand.secondOwner}                                        *
 *                                                                           *
 *  🌐  GitHub   : ${brand.githubRepo}          *
 *  ▶️  YouTube  : ${brand.youtube}                         *
 *  💬  WhatsApp : ${brand.whatsappChannel}     *
 *  🔗  Telegram : ${brand.telegramGroup}                              *
 *                                                                           *
 *    © 2026 ${brand.ownerName}. All rights reserved.                      *
 *                                                                           *
 *    Description: This file is part of the REDXBOT302 Project.              *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/`;

// ==================== UTILITIES ====================
function getAllJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(getAllJsFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

function replaceHeader(content) {
    const headerRegex = /^\/\*{79}([\s\S]*?)\*{79}\//m;
    if (headerRegex.test(content)) {
        return content.replace(headerRegex, NEW_HEADER);
    }
    return content;
}

function applyReplacements(content) {
    REPLACEMENTS.forEach(([oldStr, newStr]) => {
        content = content.split(oldStr).join(newStr);
    });
    return content;
}

// ==================== MAIN ====================
function rebrandAll() {
    console.log('🔍 Scanning for files to rebrand...');
    const folders = [
        path.join(__dirname, 'lib'),
        path.join(__dirname, 'plugins')
    ];

    let fileCount = 0;
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            console.log(`⚠️ Folder not found: ${folder}`);
            return;
        }
        const files = getAllJsFiles(folder);
        files.forEach(file => {
            let content = fs.readFileSync(file, 'utf8');
            const original = content;

            content = replaceHeader(content);
            content = applyReplacements(content);

            if (content !== original) {
                fs.writeFileSync(file, content, 'utf8');
                console.log(`✅ Updated: ${file}`);
                fileCount++;
            } else {
                console.log(`⏭️ No changes: ${file}`);
            }
        });
    });

    // Update settings.js
    const settingsPath = path.join(__dirname, 'settings.js');
    if (fs.existsSync(settingsPath)) {
        let settingsContent = fs.readFileSync(settingsPath, 'utf8');
        const originalSettings = settingsContent;
        settingsContent = applyReplacements(settingsContent);
        settingsContent = settingsContent.replace(/packname:\s*'[^']*'/, `packname: 'REDXBOT302'`);
        settingsContent = settingsContent.replace(/author:\s*'[^']*'/, `author: '${brand.ownerName}'`);
        settingsContent = settingsContent.replace(/botOwner:\s*'[^']*'/, `botOwner: '${brand.ownerName}'`);
        settingsContent = settingsContent.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${brand.ownerNumber}'`);
        settingsContent = settingsContent.replace(/channelLink:\s*'[^']*'/, `channelLink: '${brand.whatsappChannel}'`);
        settingsContent = settingsContent.replace(/ytch:\s*'[^']*'/, `ytch: '${brand.youtube.replace('https://youtube.com/@', '')}'`);
        if (settingsContent !== originalSettings) {
            fs.writeFileSync(settingsPath, settingsContent, 'utf8');
            console.log(`✅ Updated: ${settingsPath}`);
            fileCount++;
        }
    }

    // Update config.js if needed (pairing number)
    const configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, 'utf8');
        const originalConfig = configContent;
        configContent = configContent.replace(/global\.PAIRING_NUMBER = .*/, `global.PAIRING_NUMBER = "${brand.ownerNumber}";`);
        if (configContent !== originalConfig) {
            fs.writeFileSync(configPath, configContent, 'utf8');
            console.log(`✅ Updated: ${configPath}`);
            fileCount++;
        }
    }

    console.log(`\n🎉 Rebranding complete! ${fileCount} files were updated.`);
}

rebrandAll();
