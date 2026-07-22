/**
 * Fixes MDX library links that use capitalized vocation directory names.
 *
 * Problem: Links like `/vocations/Berserker/...` don't resolve because
 * actual directories are lowercase (`berserker/`).
 *
 * Run: node scripts/content/fix-vocation-link-case.mjs [--dry-run]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

/** Vocation names that need case correction in links */
const VOCATION_CASE_MAP = {
  Berserker: 'berserker',
  Pilgrim: 'pilgrim',
  Scion: 'scion',
  Strider: 'strider',
  Villein: 'villein',
  Warrior: 'warrior',
};

function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, files);
    } else if (extname(entry) === '.mdx') {
      files.push(full);
    }
  }
  return files;
}

const CONTENT_ROOT = 'src/content/en';

function fixVocationCase(content) {
  let changed = false;
  let fixed = content;

  for (const [wrong, correct] of Object.entries(VOCATION_CASE_MAP)) {
    const pattern = new RegExp(`/vocations/${wrong}/`, 'g');
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, `/vocations/${correct}/`);
      changed = true;
    }
  }

  return { content: fixed, changed };
}

const files = walkDir(CONTENT_ROOT);
let totalChanged = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  const { content, changed } = fixVocationCase(original);

  if (changed) {
    console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fixed: ${file}`);
    totalChanged++;

    if (!DRY_RUN) {
      writeFileSync(file, content);
    }
  }
}

console.log(`\n${DRY_RUN ? 'Would fix' : 'Fixed'} ${totalChanged} file(s).`);
if (DRY_RUN) {
  console.log('Run without --dry-run to apply changes.');
}
