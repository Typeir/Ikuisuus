/**
 * Translation File Cleanup Script
 *
 * @fileoverview Removes individual namespace translation files after merging.
 * Only keeps index.json files. Runs exclusively in Vercel environment.
 *
 * @module cleanTranslations
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 * @requires glob File pattern matching
 *
 * @description
 * After mergeMessages.js creates index.json for each locale, this script
 * removes the individual namespace files (layout.json, search.json, etc.)
 * to reduce deployment size. Only runs when VERCEL=1 environment variable is set.
 *
 * Safety: Skips execution outside Vercel to preserve development files.
 *
 * @example
 * // In package.json (Vercel environment)
 * "scripts": {
 *   "vercel-build": "npm run build && npm run clean-translations"
 * }
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'cleanTranslations' });

/** @constant {string} MESSAGES_DIR - Absolute path to translation messages directory */
const MESSAGES_DIR = path.join(__dirname, '..', '..', 'messages');

if (process.env.VERCEL !== '1') {
  log.message('🚫 Skipping cleanup: not running in Vercel');
  process.exit(0);
}

const locales = fs.readdirSync(MESSAGES_DIR).filter((file) => {
  return fs.statSync(path.join(MESSAGES_DIR, file)).isDirectory();
});

locales.forEach((locale) => {
  const pattern = path.join(MESSAGES_DIR, locale, '*.json');
  const files = glob.sync(pattern);

  files.forEach((file) => {
    if (!file.endsWith('index.json')) {
      fs.unlinkSync(file);
      log.message('🗑️ Deleted', { path: file });
    }
  });
});

log.message('✅ Translation cleanup complete (only index.json kept).');
