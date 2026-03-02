const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Your backend URL
const BACKEND_URL = 'https://redxmainpair-production.up.railway.app';

/**
 * Save credentials from your backend to session/creds.json
 * @param {string} sessionId - Session ID (from SESSION_ID env)
 */
async function SaveCreds(sessionId) {
    const __dirname = path.dirname(__filename);
    const endpoint = `${BACKEND_URL}/get-session?sessionId=${encodeURIComponent(sessionId)}`;

    try {
        console.log(`⬇️ Downloading session from: ${endpoint}`);
        const response = await axios.get(endpoint, { timeout: 30000 });
        
        // Ensure we have data
        if (!response.data) {
            throw new Error('Empty response from backend');
        }

        // Parse if it's a string, otherwise assume it's already an object
        let credsData;
        if (typeof response.data === 'string') {
            try {
                credsData = JSON.parse(response.data);
            } catch (parseErr) {
                console.error('❌ Downloaded data is not valid JSON:', response.data.substring(0, 200));
                throw new Error('Invalid JSON received');
            }
        } else {
            credsData = response.data;
        }

        // Validate that credsData has required fields (optional but good)
        if (!credsData.noiseKey || !credsData.signedIdentityKey) {
            console.warn('⚠️ Downloaded session may be incomplete (missing some keys)');
        }

        // Convert back to pretty JSON
        const jsonString = JSON.stringify(credsData, null, 2);
        
        const sessionDir = path.join(__dirname, '..', 'session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, jsonString);
        
        console.log('✅ Session credentials downloaded and verified.');

    } catch (error) {
        console.error('❌ Error downloading session from REDX backend:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Response:', error.response.data);
        } else if (error.request) {
            console.error('❌ No response received from backend');
        }
        throw error;
    }
}

module.exports = SaveCreds;
