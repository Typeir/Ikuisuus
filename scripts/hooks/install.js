/**
 * Git Hooks Installation Script
 *
 * @fileoverview Installs pre-commit hook
 * @module scripts/hooks/install
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

function installHook() {
  try {
    const sourceHook = path.join(__dirname, 'pre-commit.js');
    const gitDir = path.join(process.cwd(), '.git', 'hooks');
    const targetHook = path.join(gitDir, 'pre-commit');

    if (!fs.existsSync(gitDir)) {
      console.error('❌ .git/hooks directory not found');
      process.exit(1);
    }

    if (!fs.existsSync(sourceHook)) {
      console.error(`❌ Source hook not found at ${sourceHook}`);
      process.exit(1);
    }

    fs.copyFileSync(sourceHook, targetHook);
    console.log('✅ Pre-commit hook installed');

    if (process.platform !== 'win32') {
      fs.chmodSync(targetHook, '755');
    }

    console.log(`📍 Location: ${targetHook}`);
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  installHook();
}

module.exports = { installHook };
