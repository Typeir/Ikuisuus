/**
 * @fileoverview Moves a v1 trinket onto the `<Trinket>` form.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collapseBlank, openingTag, runCli, trimBlank } from './migrate-shared.mjs';

/**
 * Bold stat label → item slot.
 */
export const STAT_SLOTS = {
  damage: 'damage',
  range: 'range',
  properties: 'properties',
  weight: 'burden',
};

const STAT_LINE = /^\*\*([^*]+?)\*\*:\s*(.*?)\s*$/;
const CATEGORY_LINE = /^[A-Z][A-Za-z' ]+?\s*$/;

/**
 * Converts one trinket file.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateTrinket(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });

  if (lines.some((line) => /^<Trinket\b/.test(line))) {
    return done(text, false, 'already on the slot form');
  }
  const titleAt = lines.findIndex((line) => /^# /.test(line));
  if (titleAt < 0) return done(text, false, 'no title');

  const slots = {};
  const consumed = new Set();

  for (let i = titleAt + 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '') continue;
    if (CATEGORY_LINE.test(lines[i])) {
      slots.category = lines[i].trim();
      consumed.add(i);
    }
    break;
  }

  lines.forEach((line, i) => {
    if (i <= titleAt) return;
    const stat = line.match(STAT_LINE);
    if (!stat) return;
    const slot = STAT_SLOTS[stat[1].trim().toLowerCase()];
    if (!slot) {
      notes.push(`stat line kept as prose: ${line.trim()}`);
      return;
    }
    if (slots[slot] !== undefined) {
      notes.push(`second ${stat[1].trim()} line kept as prose`);
      return;
    }
    slots[slot] = stat[2].replace(/\.$/, '');
    consumed.add(i);
  });

  if (Object.keys(slots).length === 0) return done(text, false, 'no stat lines');

  const ordered = {
    category: slots.category,
    damage: slots.damage,
    range: slots.range,
    properties: slots.properties,
    burden: slots.burden,
  };
  const head = [...lines.slice(0, titleAt), lines[titleAt].trimEnd()];
  const body = lines.slice(titleAt + 1).filter((_, j) => !consumed.has(titleAt + 1 + j));

  const out = [
    ...head,
    '',
    ...openingTag('Trinket', ordered),
    '',
    ...trimBlank(collapseBlank(body)),
    '',
    '</Trinket>',
    '',
  ].join(eol);
  return done(out, true);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(
    migrateTrinket,
    ['.trinket.mdx'],
    'usage: migrate-trinket.mjs [--write] <path|glob>...',
  );
}
