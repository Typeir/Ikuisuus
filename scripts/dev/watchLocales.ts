/**
 * @fileoverview Watches `messages/` for changes to namespace JSON files and
 * re-runs merge-locales. For use alongside `next dev`.
 *
 * @module scripts/dev/watchLocales
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-13
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'node:child_process';
import { watch, type FSWatcher } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createLogger({ script: 'watchLocales' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/** Directory containing locale namespace JSON files. */
const MESSAGES_DIR = path.join(ROOT, 'messages');

/** Debounce interval in milliseconds. */
const DEBOUNCE_MS = 300;

/** Tracks the debounce timer. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Runs the merge-locales script synchronously.
 */
function runMerge(): void {
  try {
    execSync('npm run merge-locales', {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    log.error('merge-locales failed');
  }
}

/**
 * Handles a file change event with debouncing.
 *
 * @param {string | null} filename - The changed filename
 */
function onFileChange(filename: string | null): void {
  if (!filename || !filename.endsWith('.json')) {
    return;
  }
  const base = path.basename(filename);
  if (base === 'index.json') {
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    log.message(`Detected change in ${filename}, merging...`);
    runMerge();
  }, DEBOUNCE_MS);
}

/**
 * Starts a recursive watcher on the messages directory.
 *
 * @returns {FSWatcher} The watcher instance
 */
export function startLocaleWatcher(): FSWatcher {
  log.message('Watching messages/ for locale changes...');
  const watcher = watch(MESSAGES_DIR, { recursive: true }, (_event, filename) =>
    onFileChange(filename),
  );
  return watcher;
}

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  startLocaleWatcher();
}
