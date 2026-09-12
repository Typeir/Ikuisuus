/**
 * @fileoverview Renames the Heavy weapon property to Unwieldy.
 * @description Heavy names mass, and the property is about handling, so the
 * word had to go; armour categories, weapon names and plain English keep it
 *
 * @module scripts/content/rename-unwieldy
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import { glob, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

/**
 * Where the sweep reads.
 */
const PATTERNS = [
  'src/content/**/*.mdx',
  'tests/fixtures/**/*.mdx',
  '.github/docs/*.md',
  '.github/instructions/*.md',
  '.github/skills/**/*.md',
];

/**
 * Files whose every `heavy` is the weapon property.
 *
 * @description Both carry property tables, so a bare token in them is the term
 */
const PROPERTY_FILES = [
  'src/content/en/items/equipment/weapons.rule.mdx',
  'src/content/en/rules/arms-armour-and-burden/weapon-properties.rule.mdx',
];

/**
 * Placeholder standing in for text no rule may touch.
 */
const HOLD = ' HOLD ';

/**
 * Text that keeps the old word.
 *
 * @description Armour categories, weapon and item names, the carrying-capacity
 * tier, and a handful of titles that are simply English
 */
const PROTECTED = [
  /Crossbow, Heavy/g,
  /Heavy Crossbow/g,
  /\*\*Heavy\*\*\s+armou?r/gi,
  /\(light\/med\/heavy\)/gi,
  /\bheavy armou?r\b/gi,
  /\bHeavy Net\b/g,
  /\bheavy[- ]net\b/gi,
  /\bHeavy Frame\b/g,
  /\bHeavy Tread\b/g,
  /\bHeavy Hand\b/g,
  /\bheavy[- ]hand\b/gi,
  /\bHeavy [Ii]s the [Cc]rown\b/g,
  /\bHeavy [Ii]s the [Hh]at\b/g,
  /(['"])light\1,\s*(['"])medium\2,\s*(['"])heavy\3/g,
];

/**
 * Renames applied to every file the sweep reads.
 */
const RULES = [
  [/\*\*Heavy\*\*/g, '**Unwieldy**'],
  [/\*\*heavy\*\*/g, '**unwieldy**'],
  [/\bHeavy weapons\b/g, 'Unwieldy weapons'],
  [/\bHeavy weapon\b/g, 'Unwieldy weapon'],
  [/\bheavy weapons\b/g, 'unwieldy weapons'],
  [/\bheavy weapon\b/g, 'unwieldy weapon'],
  [/\[heavy\]\(/g, '[unwieldy]('],
  [/(['"])heavy\1/g, "$1unwieldy$1"],
];

/**
 * Renames applied only inside the property tables.
 */
const PROPERTY_RULES = [
  [/\bHeavy\b/g, 'Unwieldy'],
  [/\bheavy\b/g, 'unwieldy'],
];

/**
 * Renames applied to a line that is reading out weapon properties.
 */
const LIST_RULES = [
  [/\bHeavy\b(?=[,)])/g, 'Unwieldy'],
  [/\bheavy\b(?=[,)])/g, 'unwieldy'],
];

/**
 * Other weapon properties, as a line's own evidence that it lists them.
 *
 * @description `light` is left out, since armour and illumination both use it
 */
const NEIGHBOURS =
  /\b(?:martial|simple|two-handed|versatile|thrown|finesse|reach|loading|ammunition|bind|draw|focus|special|large|magical|mastery|ranged|melee)\b/i;

/**
 * Whether a line is reading out weapon properties.
 *
 * @param {string} line - One line of the file
 * @returns {boolean} True when the line is a property list
 */
function listsProperties(line) {
  return line.includes('base="') || NEIGHBOURS.test(line);
}

/**
 * Rewrites one file's text.
 *
 * @param {string} text - Source text
 * @param {boolean} isPropertyFile - Whether every token in it is the property
 * @returns {string} Rewritten text
 */
export function rewrite(text, isPropertyFile) {
  const held = [];
  let carry = text;

  for (const pattern of PROTECTED) {
    carry = carry.replace(pattern, (match) => {
      held.push(match);
      return `${HOLD}${held.length - 1}${HOLD}`;
    });
  }

  const rules = isPropertyFile ? [...RULES, ...PROPERTY_RULES] : RULES;
  for (const [pattern, replacement] of rules) {
    carry = carry.replace(pattern, replacement);
  }

  carry = carry
    .split('\n')
    .map((line) =>
      listsProperties(line)
        ? LIST_RULES.reduce(
            (text, [pattern, replacement]) => text.replace(pattern, replacement),
            line,
          )
        : line,
    )
    .join('\n');

  return carry.replace(
    new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g'),
    (_, index) => held[Number(index)],
  );
}

/**
 * Sweeps the corpus and reports what it left behind.
 *
 * @returns {Promise<void>} Resolves once every file is written
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const changed = [];
  const left = [];

  for await (const entry of glob(PATTERNS, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    const next = rewrite(source, PROPERTY_FILES.includes(path));

    next.split(/\r?\n/).forEach((line, index) => {
      if (/\bheavy\b/i.test(line)) {
        left.push(`${path}:${index + 1} ${line.trim().slice(0, 120)}`);
      }
    });

    if (next === source) continue;
    changed.push(path);
    if (!dryRun) await writeFile(resolve(ROOT, entry), next, 'utf8');
  }

  console.log(`${dryRun ? 'Would rewrite' : 'Rewrote'} ${changed.length} files`);
  for (const path of changed) console.log(`  ${path}`);
  console.log(`\nLeft alone, ${left.length} lines still saying heavy:`);
  for (const line of left) console.log(`  ${line}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
