module.exports = [{
  pattern: "listplugins",
  alias: ["plugins", "cmdlist"],
  desc: "List all loaded commands",
  category: "utility",
  react: "📋",
  filename: __filename,
  use: ".listplugins",
  execute: async (conn, mek, m, { from, reply }) => {
    if (!global.commands) {
      return reply("❌ Commands map not found. Make sure global.commands is set.");
    }

    const allCommands = Array.from(global.commands.keys()).sort();
    const total = allCommands.length;

    // Send in chunks to avoid message too long
    const chunkSize = 30;
    for (let i = 0; i < allCommands.length; i += chunkSize) {
      const chunk = allCommands.slice(i, i + chunkSize);
      await conn.sendMessage(from, {
        text: `📋 *Loaded Commands (${total} total)*\n\n${chunk.map(cmd => `• ${cmd}`).join('\n')}`
      }, { quoted: mek });
    }
  }
}];
