/**
 * Translation File Merger
 *
 * @fileoverview Merges namespaced translation files into a single index.json per locale.
 *
 * @module mergeMessages
 * @version 1.0.1
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 *
 * @description
 * Processes locales en, es, fi; excludes index.json files from merging.
 *
 * @example
 * npx tsx scripts/i18n/mergeMessages.ts
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const log = createLogger({ script: 'mergeMessages' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to translation messages directory */
const MESSAGES_DIR = path.join(__dirname, '..', '..', 'messages');

const locales = fs.readdirSync(MESSAGES_DIR).filter((file) => {
  return fs.statSync(path.join(MESSAGES_DIR, file)).isDirectory();
});

locales.forEach((locale) => {
  const localeDir = path.join(MESSAGES_DIR, locale);
  const files = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith('.json') && file !== 'index.json')
    .map((file) => path.join(localeDir, file));

  const merged: Record<string, unknown> = {};

  files.forEach((file) => {
    const filename = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));

    merged[filename] = content;
  });

  const outputPath = path.join(MESSAGES_DIR, locale, 'index.json');
  const newContent = JSON.stringify(merged, null, 2);
  const existing = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, 'utf-8')
    : '';

  if (newContent === existing) {
    log.message('⏭️  index.json unchanged — skipped write', {
      locale,
      count: files.length,
    });
    return;
  }

  fs.writeFileSync(outputPath, newContent, 'utf-8');

  log.message('✅ Merged files into index.json (namespaced)', {
    locale,
    count: files.length,
  });
});
