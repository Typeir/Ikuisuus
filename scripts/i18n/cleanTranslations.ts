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
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { fileURLToPath } from 'url';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'cleanTranslations' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to translation messages directory */
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
