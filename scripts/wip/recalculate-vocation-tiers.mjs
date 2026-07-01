#!/usr/bin/env node

/**
 * @fileoverview Vocation Tier Bonus Recalculator
 * @description Recalculates tier bonus values in vocation main.mdx progression
 * tables from the old formula (ceil(1+level/4)) to the new formula (ceil(level/3)).
 *
 * The table column header was already renamed "Proficiency Bonus" → "Tier Bonus"
 * by the rename script; this script only updates the numeric VALUES.
 *
 * Usage: node scripts/wip/recalculate-vocation-tiers.mjs [--dry-run]
 *
 * @module scripts/wip/recalculate-vocation-tiers
 * @version 1.0.0
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const VOCATIONS_DIR = join(
  ROOT,
  'src',
  'content',
  'en',
  'character-creation',
  'vocations',
);

/**
 * New tier bonus formula: ceil(level / 3)
 * @param {number} level
 * @returns {number}
 */
function newTierBonus(level) {
  return Math.ceil(level / 3);
}

/**
 * Process a single vocation main.mdx file.
 * @param {string} filePath
 * @param {boolean} dryRun
 */
async function processFile(filePath, dryRun) {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;
  const result = [];

  for (const line of lines) {
    // Match table rows: | N | +X | ... where N is level 1-30
    const match = line.match(/^\|\s*(\d{1,2})\s*\|\s*\+(\d{1,2})\s*\|/);
    if (match) {
      const level = parseInt(match[1], 10);
      const oldBonus = parseInt(match[2], 10);
      const newBonus = newTierBonus(level);

      if (oldBonus !== newBonus) {
        const newLine = line.replace(
          /^\|(\s*\d{1,2}\s*\|)\s*\+\d{1,2}(\s*\|)/,
          `|$1 +${newBonus}$2`,
        );
        console.log(
          `  L${lines.indexOf(line) + 1}: +${oldBonus} → +${newBonus} (level ${level})`,
        );
        result.push(newLine);
        changed = true;
        continue;
      }
    }
    result.push(line);
  }

  if (changed && !dryRun) {
    await writeFile(filePath, result.join('\n'), 'utf-8');
  }
  return changed;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`Scanning: ${VOCATIONS_DIR}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const entries = await readdir(VOCATIONS_DIR, { withFileTypes: true });
  let totalChanged = 0;
  let totalValues = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const mainFile = join(VOCATIONS_DIR, entry.name, 'main.mdx');
    try {
      const changed = await processFile(mainFile, dryRun);
      if (changed) {
        console.log(`  VOCATION: ${entry.name}`);
        totalChanged++;
      }
    } catch {
      // File doesn't exist (e.g. missing main.mdx)
    }
  }

  console.log(`\nVocation files with changes: ${totalChanged}`);
  if (dryRun) console.log('(Dry run — no files written)');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
