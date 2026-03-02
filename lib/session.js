const path = require('path');
const fs = require('fs');

/**
 * Save credentials from base64-encoded SESSION_ID to session/creds.json
 * @param {string} base64Session - Base64 string of creds.json (from SESSION_ID env)
 */
async function SaveCreds(base64Session) {
    const __dirname = path.dirname(__filename);
    const sessionDir = path.join(__dirname, '..', 'session');
    
    // Create session directory if it doesn't exist
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    try {
        // Decode base64 to JSON string
        const decoded = Buffer.from(base64Session, 'base64').toString('utf-8');
        
        // Validate JSON
        JSON.parse(decoded); // throws if invalid

        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, decoded);
        
        console.log('✅ Session credentials decoded and saved successfully.');
    } catch (error) {
        console.error('❌ Error decoding base64 session:', error.message);
        throw error;
    }
}

module.exports = SaveCreds;
