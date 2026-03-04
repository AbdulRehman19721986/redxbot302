const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.stats = new Map();
    this.cooldowns = new Map();
    this.disabledCommands = new Set();
    this.prefixlessCommands = new Map();
    // Load all commands recursively on startup
    this.loadCommandsRecursive();
    // Optional: watch for changes (only root plugins folder for simplicity)
    this.watchPlugins();
  }

  /**
   * Recursively load all .js files from the plugins directory and subdirectories.
   * @param {string} dir - Directory to scan (default: ../plugins)
   */
  loadCommandsRecursive(dir = path.join(__dirname, '../plugins')) {
    if (!fs.existsSync(dir)) {
      console.error(`[ERROR] Plugins directory not found: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        this.loadCommandsRecursive(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        this.loadPlugin(fullPath);
      }
    }
  }

  /**
   * Load a single plugin file and register it.
   * @param {string} filePath - Absolute path to the plugin file
   */
  loadPlugin(filePath) {
    try {
      delete require.cache[require.resolve(filePath)];
      const plugin = require(filePath);

      if (!plugin || typeof plugin !== 'object') {
        console.warn(`[WARN] Plugin ${filePath} does not export an object. Skipping.`);
        return;
      }

      if (!plugin.command || typeof plugin.handler !== 'function') {
        console.warn(`[WARN] Plugin ${filePath} missing 'command' or 'handler'. Skipping.`);
        return;
      }

      this.registerCommand(plugin);
      console.log(`[LOADED] ${plugin.command} from ${path.relative(__dirname, filePath)}`);
    } catch (error) {
      console.error(`[ERROR] Failed to load plugin ${filePath}:`, error.message);
    }
  }

  watchPlugins() {
    const pluginsPath = path.join(__dirname, '../plugins');
    if (!fs.existsSync(pluginsPath)) return;

    fs.watch(pluginsPath, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        const filePath = path.join(pluginsPath, filename);
        // Debounce to avoid multiple triggers
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              this.loadPlugin(filePath);
              console.log(`[WATCHER] Hot-reloaded: ${filename}`);
            }
          } catch (error) {
            console.error(`[WATCHER] Error reloading ${filename}:`, error.message);
          }
        }, 100);
      }
    });
  }

  registerCommand(plugin) {
    const { command, aliases = [], category = 'misc', handler, isPrefixless = false } = plugin;
    const cmdKey = command.toLowerCase();

    // Warn on duplicate
    if (this.commands.has(cmdKey)) {
      console.warn(`[WARN] Command "${cmdKey}" is being overwritten by ${command}`);
    }

    // Initialize stats
    this.stats.set(cmdKey, {
      calls: 0,
      errors: 0,
      totalTime: 0n,
      avgMs: 0
    });

    // Wrap handler with monitoring, cooldown, disabled check
    const monitoredHandler = async (sock, message, ...args) => {
      const s = this.stats.get(cmdKey);

      if (this.disabledCommands.has(cmdKey)) {
        await sock.sendMessage(message.key.remoteJid, {
          text: `🚫 The command *${cmdKey}* is currently disabled.`
        }, { quoted: message });
        return;
      }

      const userId = message.key.participant || message.key.remoteJid;
      const now = Date.now();
      const cooldownKey = `${userId}_${cmdKey}`;
      const cooldownTime = plugin.cooldown || 3000;

      if (this.cooldowns.has(cooldownKey)) {
        const expirationTime = this.cooldowns.get(cooldownKey) + cooldownTime;
        if (now < expirationTime) return; // silent cooldown
      }

      this.cooldowns.set(cooldownKey, now);
      const start = process.hrtime.bigint();

      try {
        s.calls++;
        return await handler(sock, message, ...args);
      } catch (err) {
        s.errors++;
        throw err;
      } finally {
        const end = process.hrtime.bigint();
        s.totalTime += end - start;
        s.avgMs = Number(s.totalTime / BigInt(s.calls || 1)) / 1_000_000;
      }
    };

    // Store command
    this.commands.set(cmdKey, {
      ...plugin,
      command,
      handler: monitoredHandler,
      category: category.toLowerCase(),
      aliases
    });

    // Register aliases
    for (const alias of aliases) {
      this.aliases.set(alias.toLowerCase(), cmdKey);
    }

    // Add to category list
    const cat = category.toLowerCase();
    if (!this.categories.has(cat)) {
      this.categories.set(cat, []);
    }
    if (!this.categories.get(cat).includes(command)) {
      this.categories.get(cat).push(command);
    }

    // Register prefixless if enabled
    if (isPrefixless) {
      this.prefixlessCommands.set(cmdKey, cmdKey);
      for (const alias of aliases) {
        this.prefixlessCommands.set(alias.toLowerCase(), cmdKey);
      }
    }
  }

  toggleCommand(name) {
    const cmd = name.toLowerCase();
    if (this.disabledCommands.has(cmd)) {
      this.disabledCommands.delete(cmd);
      return 'enabled';
    } else {
      this.disabledCommands.add(cmd);
      return 'disabled';
    }
  }

  _levenshtein(a, b) {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) tmp[i] = [i];
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[a.length][b.length];
  }

  findSuggestion(cmd) {
    const allNames = [...this.commands.keys(), ...this.aliases.keys()];
    let bestMatch = null;
    let minDistance = 3;

    for (const name of allNames) {
      const distance = this._levenshtein(cmd, name);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = name;
      }
    }
    return bestMatch;
  }

  getDiagnostics() {
    return Array.from(this.stats.entries()).map(([name, data]) => ({
      command: name,
      usage: data.calls,
      errors: data.errors,
      average_speed: `${data.avgMs.toFixed(3)}ms`,
      status: this.disabledCommands.has(name) ? 'OFF' : 'ON'
    })).sort((a, b) => b.usage - a.usage);
  }

  resetStats() {
    this.stats.clear();
    this.cooldowns.clear();
    for (const cmd of this.commands.keys()) {
      this.stats.set(cmd, { calls: 0, errors: 0, totalTime: 0n, avgMs: 0 });
    }
  }

  reloadCommands() {
    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();
    this.stats.clear();
    this.cooldowns.clear();
    this.disabledCommands.clear();
    this.prefixlessCommands.clear();
    this.loadCommandsRecursive();
  }

  getCommand(text, prefixes) {
    const usedPrefix = prefixes.find(p => text.startsWith(p));
    const firstWord = text.trim().split(' ')[0].toLowerCase();

    if (!usedPrefix) {
      if (this.prefixlessCommands.has(firstWord)) {
        const targetCmd = this.prefixlessCommands.get(firstWord);
        return this.commands.get(targetCmd);
      }
      return null;
    }

    const fullCommand = text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase();

    if (this.commands.has(fullCommand)) {
      return this.commands.get(fullCommand);
    }
    if (this.aliases.has(fullCommand)) {
      const mainCommand = this.aliases.get(fullCommand);
      return this.commands.get(mainCommand);
    }

    const suggestion = this.findSuggestion(fullCommand);
    if (suggestion) {
      return {
        command: suggestion,
        handler: async (sock, message) => {
          const chatId = message.key.remoteJid;
          await sock.sendMessage(chatId, {
            text: `❓ Did you mean *${usedPrefix}${suggestion}*?`
          }, { quoted: message });
        }
      };
    }

    return null;
  }

  getCommandsByCategory(category) {
    return this.categories.get(category.toLowerCase()) || [];
  }

  // Alias for backward compatibility
  loadCommands() {
    this.loadCommandsRecursive();
  }
}

module.exports = new CommandHandler();
