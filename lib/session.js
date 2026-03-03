const path = require('path');
const fs = require('fs');
const { File } = require('megajs');

/**
 * Download session credentials from a Mega.nz link and save to session/creds.json
 * @param {string} sessionInput - Mega.nz link or file ID (with optional IK~ prefix)
 */
async function SaveCreds(sessionInput) {
    const __dirname = path.dirname(__filename);
    const sessionDir = path.join(__dirname, '..', 'session');
    const credsPath = path.join(sessionDir, 'creds.json');

    // Ensure session directory exists
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log('⬇️ Downloading session from Mega...');

    // Parse the input – could be a full URL or just the file ID
    let megaUrl;
    if (sessionInput.startsWith('http')) {
        megaUrl = sessionInput;
    } else {
        // Assume it's just the file ID, possibly with IK~ prefix
        const fileId = sessionInput.replace('IK~', '');
        megaUrl = `https://mega.nz/file/${fileId}`;
    }

    try {
        const file = File.fromURL(megaUrl);
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        // Validate that the downloaded data is valid JSON
        try {
            JSON.parse(data.toString());
        } catch (e) {
            throw new Error('Downloaded file is not valid JSON');
        }

        fs.writeFileSync(credsPath, data);
        console.log('✅ Session downloaded successfully!');
        return JSON.parse(data.toString());
    } catch (err) {
        console.error('❌ Error downloading or saving credentials:', err.message);
        throw err;
    }
}

module.exports = SaveCreds;
