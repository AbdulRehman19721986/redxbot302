const fs = require('fs');
const path = require('path');
const store = require('./lightweight_store');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Owner names for reference
const OWNERS = 'Abdul Rehman Rajpoot & Muzamil Khan';

// Load initial state
async function loadCommandReactState() {
  try {
    if (HAS_DB) {
      const data = await store.getSetting('global', 'userGroupData');
      return data?.autoReaction ?? true; // default true
    } else {
      if (fs.existsSync(USER_GROUP_DATA)) {
        const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
        return data.autoReaction ?? true; // default true
      }
    }
  } catch {}
  return true; // default to enabled
}

let COMMAND_REACT_ENABLED = true;

loadCommandReactState().then(state => {
  COMMAND_REACT_ENABLED = state;
});

/**
 * Send a reaction to a message
 * @param {Object} sock - WhatsApp socket
 * @param {Object} message - The message to react to
 * @param {string} emoji - Emoji to react with
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

/**
 * Send a "⏳" reaction when command starts processing
 */
async function addCommandReaction(sock, message) {
  await sendReaction(sock, message, '⏳');
}

/**
 * Send a "👍" reaction when command succeeds
 */
async function addSuccessReaction(sock, message) {
  await sendReaction(sock, message, '👍');
}

/**
 * Send a "❌" reaction when command fails
 */
async function addErrorReaction(sock, message) {
  await sendReaction(sock, message, '❌');
}

/**
 * Enable or disable command reactions
 */
async function setCommandReactState(state) {
  COMMAND_REACT_ENABLED = state;
  
  try {
    if (HAS_DB) {
      const data = await store.getSetting('global', 'userGroupData') || {};
      data.autoReaction = state;
      await store.saveSetting('global', 'userGroupData', data);
    } else {
      let data = {};
      if (fs.existsSync(USER_GROUP_DATA)) {
        data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
      }
      data.autoReaction = state;
      fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error saving command react state:', error);
  }
}

module.exports = {
  addCommandReaction,
  addSuccessReaction,
  addErrorReaction,
  setCommandReactState,
  loadCommandReactState
};
