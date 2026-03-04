const { useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');
const path = require('path');

module.exports = [{
  pattern: "pair",
  alias: ["paircode", "getpair"],
  desc: "Generate a WhatsApp pairing code for any number",
  category: "utility",
  react: "🔑",
  filename: __filename,
  use: ".pair <phone number>",
  execute: async (conn, mek, m, { from, args, reply }) => {
    if (!args.length) {
      return reply("❌ Please provide a phone number.\nExample: .pair 61468259338");
    }

    const number = args[0].replace(/\D/g, '');
    if (number.length < 10 || number.length > 15) {
      return reply("❌ Invalid number format. Use country code without + or spaces.");
    }

    const tmpDir = path.join(__dirname, '../temp_pair', number);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    await reply(`⏳ Generating pairing code for +${number}...`);

    try {
      const { state, saveCreds } = await useMultiFileAuthState(tmpDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS("Safari"),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        maxIdleTimeMs: 60000,
        maxRetries: 5,
        markOnlineOnConnect: true,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000,
        syncFullHistory: false
      });

      // Wait a bit for the connection to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pairingCode = await sock.requestPairingCode(number);

      // Clean up temp session
      setTimeout(() => {
        sock.ws.close();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }, 5000);

      await conn.sendMessage(from, {
        text: `✅ *Pairing Code for +${number}:*\n\n*${pairingCode}*\n\n_This code expires in 5 minutes. Open WhatsApp → Linked Devices → Link a Device → enter this code._`
      }, { quoted: mek });

    } catch (error) {
      console.error("Pairing error:", error);
      await reply(`❌ Failed to generate pairing code: ${error.message}`);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}];
