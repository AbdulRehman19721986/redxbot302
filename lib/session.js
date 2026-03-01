const path = require('path');
const fs = require('fs');
const { File } = require('megajs');

/**
 * Save credentials from MEGA to session/creds.json
 * @param {string} sessionId - MEGA file ID (can be with or without IK~ prefix)
 */
async function SaveCreds(sessionId) {
    const __dirname = path.dirname(__filename);
    const sessionDir = path.join(__dirname, '..', 'session');
    const credsPath = path.join(sessionDir, 'creds.json');

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
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
        console.error('❌ Error downloading or saving credentials:', err.message);
        throw err;
    }
}

module.exports = SaveCreds;
