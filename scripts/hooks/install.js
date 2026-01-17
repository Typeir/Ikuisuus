/**
 * Git Hooks Installation Script
 *
 * @fileoverview Installs pre-commit and commit-msg hooks
 * @module scripts/hooks/install
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

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
      console.error('❌ .git/hooks directory not found');
      process.exit(1);
    }

    if (!fs.existsSync(sourceHook)) {
      console.error(`❌ Source hook not found at ${sourceHook}`);
      process.exit(1);
    }

    fs.copyFileSync(sourceHook, targetHook);
    console.log(`✅ ${hookName} hook installed`);

    if (process.platform !== 'win32') {
      fs.chmodSync(targetHook, '755');
    }

    console.log(`📍 Location: ${targetHook}`);
  } catch (error) {
    console.error(`❌ ${hookName} installation failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Installs all hooks
 */
function installAllHooks() {
  console.log('Installing git hooks...\n');
  installHook('pre-commit');
  installHook('commit-msg');
  console.log('\n✨ All hooks installed successfully');
}

if (require.main === module) {
  installAllHooks();
}

module.exports = { installHook, installAllHooks };
