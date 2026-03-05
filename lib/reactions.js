const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/react_state.json');

// Default to enabled
let COMMAND_REACT_ENABLED = true;

// Load state from file
function loadReactState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      COMMAND_REACT_ENABLED = data.enabled !== false;
    } else {
      // Create default file
      fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled: true }));
    }
  } catch (e) {
    console.error('Error loading react state:', e);
  }
}

// Save state
function saveReactState(enabled) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled }));
  } catch (e) {
    console.error('Error saving react state:', e);
  }
}

// Initialize
loadReactState();

/**
 * Send a reaction to a message
 */
async function sendReaction(sock, message, emoji) {
  if (!COMMAND_REACT_ENABLED) return;
  if (!message?.key?.id) return;
  try {
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: emoji, key: message.key }
    });
  } catch (error) {
    console.error('❌ Error sending reaction:', error);
  }
}

async function addCommandReaction(sock, message) {
  await sendReaction(sock, message, '⏳');
}

async function addSuccessReaction(sock, message) {
  await sendReaction(sock, message, '✅');
}

async function addErrorReaction(sock, message) {
  await sendReaction(sock, message, '❌');
}

async function setReactState(enabled) {
  COMMAND_REACT_ENABLED = enabled;
  saveReactState(enabled);
}

async function getReactState() {
  return COMMAND_REACT_ENABLED;
}

module.exports = {
  addCommandReaction,
  addSuccessReaction,
  addErrorReaction,
  setReactState,
  getReactState
};
