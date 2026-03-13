/**
 * Translation File Merger
 *
 * @fileoverview Merges namespaced translation files into a single index.json per locale.
 * Consolidates i18n messages for next-intl consumption at runtime.
 *
 * @module mergeMessages
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 * @requires glob File pattern matching
 *
 * @description
 * Iterates through each locale directory (en, es, fi) and merges all .json files
 * (except index.json) into a single namespaced index.json file. This allows
 * developers to work with separate namespace files (layout.json, search.json, etc.)
 * while providing next-intl with a single unified file.
 *
 * File Structure:
 * ```
 * messages/
 *   en/
 *     layout.json      → merged into index.json with key "layout"
 *     search.json      → merged into index.json with key "search"
 *     index.json       → output (auto-generated)
 * ```
 *
 * @example
 * // Run from command line
 * node mergeMessages.js
 * // Output:
 * // ✅ en: merged 4 files into index.json (namespaced)
 * // ✅ es: merged 1 files into index.json (namespaced)
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'mergeMessages' });

/** @constant {string} MESSAGES_DIR - Absolute path to translation messages directory */
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

  let merged = {};

  files.forEach((file) => {
    const filename = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));

    merged[filename] = content;
  });

  const outputPath = path.join(MESSAGES_DIR, locale, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');

  log.message('✅ Merged files into index.json (namespaced)', {
    locale,
    count: files.length,
  });
});
