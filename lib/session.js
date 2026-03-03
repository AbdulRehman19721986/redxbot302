const path = require('path');
const fs = require('fs');
const { File } = require('megajs');

/**
 * Download session credentials from Mega or decode from base64.
 * @param {string} sessionInput - Mega link, file ID, or base64-encoded JSON string.
 */
async function SaveCreds(sessionInput) {
    const __dirname = path.dirname(__filename);
    const sessionDir = path.join(__dirname, '..', 'session');
    const credsPath = path.join(sessionDir, 'creds.json');

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log('⬇️ Loading session...');
    let dataBuffer;

    // Clean the input: remove any whitespace (newlines, spaces, tabs)
    const cleanInput = sessionInput.replace(/\s/g, '');

    // Check if it's a Mega link (starts with http or looks like a file ID)
    const isMega = cleanInput.startsWith('http') || /^[A-Za-z0-9_-]{8,}$/.test(cleanInput);
    
    if (isMega) {
        console.log('🔗 Detected Mega link, downloading...');
        let megaUrl;
        if (cleanInput.startsWith('http')) {
            megaUrl = cleanInput;
        } else {
            const fileId = cleanInput.replace('IK~', '');
            megaUrl = `https://mega.nz/file/${fileId}`;
        }

        try {
            const file = File.fromURL(megaUrl);
            dataBuffer = await new Promise((resolve, reject) => {
                file.download((err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
            console.log('✅ Mega download complete.');
        } catch (err) {
            console.error('❌ Mega download failed:', err.message);
            throw err;
        }
    } else {
        // Assume it's a base64-encoded JSON string
        console.log('🔤 Decoding base64 session...');
        try {
            dataBuffer = Buffer.from(cleanInput, 'base64');
            console.log('✅ Base64 decoded.');
        } catch (err) {
            console.error('❌ Invalid base64 string:', err.message);
            throw new Error('SESSION_ID is neither a valid Mega link nor a base64 string.');
        }
    }

    // Convert buffer to string and trim any extra whitespace
    const text = dataBuffer.toString().trim();
    
    // Validate JSON
    let creds;
    try {
        creds = JSON.parse(text);
    } catch (e) {
        console.error('❌ Downloaded data is not valid JSON:', e.message);
        // Log first 200 characters for debugging
        console.error('First 200 characters:', text.substring(0, 200));
        throw new Error('Session file is not valid JSON.');
    }

    // Check for essential fields (you can expand this list)
    const required = ['noiseKey', 'signedIdentityKey', 'signedPreKey', 'registrationId', 'advSecretKey', 'me'];
    const missing = required.filter(f => !creds[f]);
    if (missing.length > 0) {
        console.error('❌ Session missing required fields:', missing.join(', '));
        throw new Error('Session file is incomplete (missing required keys).');
    }

    // If the session is not registered, we can try to force registration? Better to reject.
    if (creds.registered !== true) {
        console.warn('⚠️ Session is not registered. It may not work.');
        // Optionally, you can set registered to true, but that's risky.
        // We'll let it proceed but warn.
    }

    // Write to file
    fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
    console.log('✅ Session saved to disk.');
    return creds;
}

module.exports = SaveCreds;
