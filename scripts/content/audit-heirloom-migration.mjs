/**
 * @fileoverview Compares each migrated heirloom against its committed version
 * and reports mechanical drift: dice, units, keywords and bare numbers that
 * were dropped, added or changed. The migration may restructure and reword
 * freely, so prose is not compared — only the load-bearing tokens a migration
 * is forbidden to touch.
 *
 *   node scripts/content/audit-heirloom-migration.mjs
 *   node scripts/content/audit-heirloom-migration.mjs --json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const DICE = /\[%[^%]*%\]/g;
const UNIT = /\[=[^=]*=\]/g;
const KEYWORD = /\[#[^#]*#\]/g;
const NUMBER = /(?<![\w.])\d+(?:d\d+)?(?![\w.])/g;

/**
 * A dice token reduced to its rollable core, so `[% 4d10 bludgeoning %]` and
 * `[% 4d10 %]` compare equal. A damage type moving on or off a die is an
 * editorial change; the die itself going missing is not.
 *
 * @param {string} token - Dice token.
 * @returns {string} The dice core, or the token when it rolls nothing.
 */
function diceCore(token) {
  const inner = token.replace(/^\[%|%\]$/g, '').trim();
  const rolls = inner.match(/\d*d\d+|[+-]\s*\d+|\d+/g);
  return rolls ? rolls.join(' ').replace(/\s+/g, ' ') : inner;
}

/**
 * Multiset of a pattern's matches, normalised for whitespace.
 *
 * @param {string} text - Source text.
 * @param {RegExp} pattern - Global pattern.
 * @returns {Map<string, number>} Token to count.
 */
function tally(text, pattern) {
  const counts = new Map();
  for (const match of text.match(pattern) ?? []) {
    const key = match.replace(/\s+/g, ' ').trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Tokens whose counts differ between two tallies.
 *
 * @param {Map<string, number>} before - Committed tally.
 * @param {Map<string, number>} after - Working tally.
 * @returns {{ lost: string[], gained: string[] }} Differences.
 */
function diff(before, after) {
  const lost = [];
  const gained = [];
  for (const [key, count] of before) {
    const now = after.get(key) ?? 0;
    if (now < count) lost.push(`${key}${count - now > 1 ? ` ×${count - now}` : ''}`);
  }
  for (const [key, count] of after) {
    const was = before.get(key) ?? 0;
    if (count > was) gained.push(`${key}${count - was > 1 ? ` ×${count - was}` : ''}`);
  }
  return { lost, gained };
}

const files = globSync('src/content/en/items/heirlooms/*.heirloom.mdx').sort();
const report = [];

for (const file of files) {
  const now = readFileSync(file, 'utf8');
  if (!now.includes('<Heirloom')) continue;

  let was;
  try {
    was = execFileSync(
      'git',
      ['show', `HEAD:${file.replace(/\\/g, '/').replace(/^src\/content\//, '')}`],
      { cwd: 'src/content', encoding: 'utf8', maxBuffer: 1 << 24 },
    );
  } catch {
    continue;
  }

  const entry = { file, dice: null, units: null, keywords: null, numbers: null };
  let flagged = false;

  for (const [label, pattern] of [
    ['dice', DICE],
    ['units', UNIT],
    ['keywords', KEYWORD],
    ['numbers', NUMBER],
  ]) {
    const d =
      label === 'dice'
        ? diff(
            tally(was.replace(DICE, (t) => '[% ' + diceCore(t) + ' %]'), pattern),
            tally(now.replace(DICE, (t) => '[% ' + diceCore(t) + ' %]'), pattern),
          )
        : diff(tally(was, pattern), tally(now, pattern));
    if (d.lost.length || d.gained.length) {
      entry[label] = d;
      flagged = true;
    }
  }

  if (flagged) report.push(entry);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const entry of report) {
    const name = entry.file.split(/[\\/]/).pop().replace('.heirloom.mdx', '');
    console.log(`\n== ${name}`);
    for (const label of ['dice', 'units', 'keywords', 'numbers']) {
      const d = entry[label];
      if (!d) continue;
      if (d.lost.length) console.log(`   -${label}: ${d.lost.join(', ')}`);
      if (d.gained.length) console.log(`   +${label}: ${d.gained.join(', ')}`);
    }
  }
  console.log(`\n${report.length} of ${files.length} files show token drift.`);
}
