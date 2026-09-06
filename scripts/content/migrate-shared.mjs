/**
 * @fileoverview Helpers the content-v2 converters share: tag printing, table
 * cells, feature-heading parentheticals, file expansion and the dry-run CLI.
 */

import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A markdown heading: its hashes and its text.
 */
export const HEADING = /^(#{1,6})\s+(.*?)\s*$/;

/**
 * One parenthetical on a feature heading → slot.
 */
export const FEATURE_HEADING_SLOTS = [
  { test: /^Costs? (\d+ (?:Legendary )?Deeds?)$/i, slot: 'cost', value: (m) => m[1] },
  { test: /^Recharge (.+)$/i, slot: 'recharge', value: (m) => m[1] },
  { test: /^(\d+\/\w+)$/, slot: 'charges', value: (m) => m[1] },
  { test: /^Minor Action$/i, slot: 'cost', value: () => '1 Minor Action' },
  { test: /^Reaction$/i, slot: 'cost', value: () => '1 Reaction' },
];

const TRAILING_PAREN = /^(.*?)\s*\(([^()]*)\)$/;

/**
 * Cells of a markdown table row.
 *
 * @param {string} line - Table row
 * @returns {string[]} Trimmed cells
 */
export function cells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * An attribute for a tag, quoted with whichever quote the value lacks.
 *
 * @param {string} name - Attribute name
 * @param {string | true} value - Attribute value
 * @returns {string} `name="value"` or `name`
 */
export function attribute(name, value) {
  if (value === true) return name;
  const quote = value.includes('"') ? "'" : '"';
  return `${name}=${quote}${value}${quote}`;
}

/**
 * An opening tag with one attribute per line, as the v2 files write it.
 *
 * @param {string} name - Tag name
 * @param {Record<string, string | true>} slots - Attributes in order
 * @returns {string[]} Tag lines
 */
export function openingTag(name, slots) {
  const attrs = Object.entries(slots)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `  ${attribute(key, value)}`);
  if (attrs.length === 0) return [`<${name}>`];
  if (attrs.length === 1) return [`<${name} ${attrs[0].trim()}>`];
  const last = attrs.pop();
  return [`<${name}`, ...attrs, `${last}>`];
}

/**
 * Slots a feature heading's trailing parenthetical declares, and the heading
 * without it.
 *
 * @param {string} title - Heading text
 * @param {Record<string, string>} [given] - Slots the section imposes
 * @returns {{ title: string, slots: Record<string, string> }} Heading and slots
 */
export function headingSlots(title, given = {}) {
  const slots = { ...given };
  let out = title.trim();
  for (;;) {
    const paren = out.match(TRAILING_PAREN);
    if (!paren) break;
    const inner = paren[2].trim();
    const rule = FEATURE_HEADING_SLOTS.find((r) => r.test.test(inner));
    if (!rule) break;
    slots[rule.slot] = rule.value(inner.match(rule.test));
    out = paren[1].trim();
  }
  return { title: out, slots };
}

/**
 * Lines with leading and trailing blank lines removed.
 *
 * @param {string[]} lines - Lines
 * @returns {string[]} Trimmed copy
 */
export function trimBlank(lines) {
  let from = 0;
  let to = lines.length;
  while (from < to && lines[from].trim() === '') from += 1;
  while (to > from && lines[to - 1].trim() === '') to -= 1;
  return lines.slice(from, to);
}

/**
 * Lines with every run of blank lines collapsed to one.
 *
 * @param {string[]} lines - Lines
 * @returns {string[]} Collapsed copy
 */
export function collapseBlank(lines) {
  const out = [];
  for (const line of lines) {
    if (line.trim() === '' && out.length && out[out.length - 1].trim() === '') continue;
    out.push(line);
  }
  return out;
}

/**
 * The text of the file's `# ` title, or an empty string.
 *
 * @param {string[]} lines - File lines
 * @returns {string} Title text
 */
export function titleOf(lines) {
  const line = lines.find((l) => /^# /.test(l));
  return line ? line.replace(/^# /, '').trim() : '';
}

/**
 * Index of the line that closes the frontmatter, or -1 without one.
 *
 * @param {string[]} lines - File lines
 * @returns {number} Closing `---` index
 */
export function frontmatterEnd(lines) {
  if (lines[0] !== '---') return -1;
  return lines.findIndex((line, i) => i > 0 && line === '---');
}

/**
 * Expands paths and globs into content files.
 *
 * @param {string[]} inputs - Paths, directories or globs
 * @param {string[]} suffixes - File suffixes a directory expands to
 * @returns {string[]} Files, sorted
 */
export function resolveFiles(inputs, suffixes) {
  const out = new Set();
  for (const input of inputs) {
    if (input.includes('*')) {
      globSync(input).forEach((file) => out.add(file));
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(input).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) {
      out.add(input);
      continue;
    }
    for (const suffix of suffixes) {
      globSync(join(input, '**', `*${suffix}`)).forEach((f) => out.add(f));
    }
  }
  return [...out].sort();
}

/**
 * Runs a converter over the command line's files and prints a report.
 *
 * @param {(text: string, file: string) => { text: string, changed: boolean, skipped?: string, notes: string[] }} convert - Converter, given the file path for what the path decides
 * @param {string[]} suffixes - File suffixes a directory expands to
 * @param {string} usage - Usage line for an empty call
 */
export function runCli(convert, suffixes, usage) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const quiet = args.includes('--quiet');
  const inputs = args.filter((arg) => !arg.startsWith('--'));
  if (inputs.length === 0) {
    console.error(usage);
    process.exit(2);
  }
  let converted = 0;
  let skipped = 0;
  for (const file of resolveFiles(inputs, suffixes)) {
    const before = readFileSync(file, 'utf8');
    const { text, changed, skipped: why, notes } = convert(before, file);
    if (!changed) {
      skipped += 1;
      console.log(`skip   ${file}  (${why})`);
      continue;
    }
    converted += 1;
    console.log(`${write ? 'wrote ' : 'would '} ${file}`);
    if (!quiet) for (const note of notes) console.log(`         ? ${note}`);
    if (write) writeFileSync(file, text);
  }
  console.log(`${write ? 'converted' : 'would convert'} ${converted}, skipped ${skipped}`);
}
