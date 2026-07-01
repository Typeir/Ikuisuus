#!/usr/bin/env node

/**
 * @fileoverview CLI entry point for the tier bonus rename script.
 *
 * Usage: node scripts/wip/rename-tier-bonus-cli.mjs [--dry-run] [scanDir]
 *
 * @module scripts/wip/rename-tier-bonus-cli
 * @version 1.0.0
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { applyRules } from './rename-tier-bonus.mjs';

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'temp',
  '.git',
  '.paw',
  'rename-tier-bonus.fixtures',
]);

const PROCESS_EXTENSIONS = new Set([
  '.mdx',
  '.ts',
  '.tsx',
  '.json',
  '.mjs',
  '.md',
  '.js',
]);

/**
 * Recursively collect all processable files.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function collectFiles(dir) {
  /** @type {string[]} */
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        results.push(...(await collectFiles(full)));
      }
    } else if (entry.isFile()) {
      if (PROCESS_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run(dryRun, scanDir, logFile) {
  const cwd = resolve(scanDir);
  const allChanges = [];
  console.log(`Scanning: ${cwd}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  const files = await collectFiles(cwd);
  console.log(`Found ${files.length} files to process.\n`);
  for (const filePath of files) {
    const rel = relative(cwd, filePath);
    try {
      const original = await readFile(filePath, 'utf-8');
      const result = applyRules(original, rel);
      if (result.changed) {
        console.log(`  MODIFIED: ${rel} (${result.changes.length} change(s))`);
        for (const c of result.changes) {
          console.log(`    L${c.line}: "${c.old}" → "${c.new}"`);
        }
        allChanges.push(...result.changes);
        if (!dryRun) await writeFile(filePath, result.content, 'utf-8');
      }
    } catch (err) {
      console.error(`  ERROR: ${rel}: ${err.message}`);
    }
  }
  console.log(
    `\nTotal: ${allChanges.length} changes in ${new Set(allChanges.map((c) => c.file)).size} files.`,
  );
  await writeFile(logFile, JSON.stringify(allChanges, null, 2), 'utf-8');
  console.log(`Log: ${logFile}`);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const scanDir = args.find((a) => !a.startsWith('--')) || '.';

run(dryRun, scanDir, '.ignore/reports/tier-bonus-rename-log.json')
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
