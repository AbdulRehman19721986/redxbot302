const fs = require('fs');
const path = require('path');

module.exports = [{
  pattern: "reload",
  alias: ["refresh", "rld"],
  desc: "Reload all commands without restart (owner only)",
  category: "owner",
  react: "🔄",
  filename: __filename,
  use: ".reload",
  execute: async (conn, mek, m, { from, reply, sender }) => {
    const ownerJid = '61468259338@s.whatsapp.net';
    if (sender !== ownerJid) {
      return reply("❌ Only owner can use this command.");
    }

    await reply("🔄 Reloading commands...");

    try {
      // Path to plugins folder
      const pluginsPath = path.join(__dirname);
      
      // Get all plugin files (excluding this one)
      const files = fs.readdirSync(pluginsPath).filter(file => 
        file.endsWith('.js') && file !== 'reload.js'
      );

      // Clear require cache for each file
      files.forEach(file => {
        const filePath = path.join(pluginsPath, file);
        delete require.cache[require.resolve(filePath)];
      });

      // If global.commands exists, rebuild it
      if (global.commands && typeof global.commands.clear === 'function') {
        global.commands.clear();
        
        files.forEach(file => {
          const filePath = path.join(pluginsPath, file);
          try {
            const commandModule = require(filePath);
            // Handle both single command and array formats
            if (Array.isArray(commandModule)) {
              commandModule.forEach(cmd => {
                if (cmd && cmd.pattern) {
                  global.commands.set(cmd.pattern, cmd);
                  // Also register aliases if present
                  if (cmd.alias && Array.isArray(cmd.alias)) {
                    cmd.alias.forEach(alias => global.commands.set(alias, cmd));
                  }
                }
              });
            } else if (commandModule && commandModule.pattern) {
              global.commands.set(commandModule.pattern, commandModule);
              if (commandModule.alias && Array.isArray(commandModule.alias)) {
                commandModule.alias.forEach(alias => global.commands.set(alias, commandModule));
              }
            }
          } catch (err) {
            console.error(`Error reloading ${file}:`, err.message);
          }
        });

        await reply(`✅ Commands reloaded. Total: ${global.commands.size}`);
      } else {
        await reply("✅ Cache cleared. Please restart the bot for changes to take effect.");
      }

    } catch (err) {
      await reply(`❌ Error: ${err.message}`);
    }
  }
}];
