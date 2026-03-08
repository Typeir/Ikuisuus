/**
 * Git Hooks Installation Script
 *
 * @fileoverview Installs pre-commit and commit-msg hooks
 * @module scripts/hooks/install
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'install-hooks' });

/**
 * Installs a git hook
 * @param {string} hookName - Name of the hook (e.g., 'pre-commit', 'commit-msg')
 */
function installHook(hookName) {
  try {
    const sourceHook = path.join(__dirname, `${hookName}.js`);
    const gitDir = path.join(process.cwd(), '.git', 'hooks');
    const targetHook = path.join(gitDir, hookName);

    if (!fs.existsSync(gitDir)) {
      log.error('❌ .git/hooks directory not found');
      process.exit(1);
    }

    if (!fs.existsSync(sourceHook)) {
      log.error('❌ Source hook not found', { path: sourceHook });
      process.exit(1);
    }

    fs.copyFileSync(sourceHook, targetHook);
    log.message(`✅ ${hookName} hook installed`);

    if (process.platform !== 'win32') {
      fs.chmodSync(targetHook, '755');
    }

    log.message(`📍 Location: ${targetHook}`);
  } catch (error) {
    log.error(`❌ ${hookName} installation failed`, { error: error.message });
    process.exit(1);
  }
}

/**
 * Installs all hooks
 */
function installAllHooks() {
  log.message('Installing git hooks...');
  installHook('pre-commit');
  installHook('commit-msg');
  log.message('\n✨ All hooks installed successfully');
}

if (require.main === module) {
  installAllHooks();
}

module.exports = { installHook, installAllHooks };
