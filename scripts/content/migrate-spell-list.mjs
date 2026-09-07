/**
 * @fileoverview Moves a sheet's spell tables and spell bullet lists onto `<SpellList>`.
 * @description A markdown table whose first column links spells becomes the
 * tag with one `<Column>` per further header; a bullet list of spell links
 * with spell-point tails becomes the tag with a Cost column.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cells, runCli } from './migrate-shared.mjs';

const SPELL_LINK = /^\[_?([^\]]+?)_?\]\(\/en\/library\/spells\/([a-z0-9-]+)\)$/;
const BULLET = /^- \[_?([^\]]+?)_?\]\(\/en\/library\/spells\/([a-z0-9-]+)\)\s*(?:[—–-]\s*(.*))?$/;
const POINTS = /^\*\*(\d+ spell points?)\*\*$/i;

/**
 * Lines of one `<SpellList>` block.
 *
 * @param {string[]} slugs - Spell slugs in order
 * @param {Array<{ label: string, values: string[] }>} columns - Extra columns
 * @returns {string[]} Block lines
 */
export function spellListLines(slugs, columns) {
  const open = `<SpellList spells="${slugs.join(', ')}"`;
  if (columns.length === 0) return [`${open} />`];
  const out = [`${open}>`];
  for (const column of columns) {
    if (column.values.every((value) => !value.includes(',') && !value.includes('"'))) {
      out.push(`  <Column label="${column.label}" values="${column.values.join(', ')}" />`);
    } else {
      out.push(`  <Column label="${column.label}">`);
      column.values.forEach((value, i) => {
        if (value !== '') out.push(`    <Row at="${slugs[i]}">${value}</Row>`);
      });
      out.push('  </Column>');
    }
  }
  out.push('</SpellList>');
  return out;
}

/**
 * Converts a table block, or explains why not.
 *
 * @param {string[]} block - Table lines
 * @returns {{ lines?: string[], note?: string }} Replacement or note
 */
function convertTable(block) {
  const header = cells(block[0]).map((cell) => cell.replace(/\*\*/g, '').trim());
  const rows = block.slice(2).map(cells);
  const links = rows.map((row) => (row[0] ?? '').trim().match(SPELL_LINK));
  if (rows.length === 0 || links.some((link) => !link)) {
    return { note: `table kept: ${header.join(' | ')}` };
  }
  const slugs = links.map((link) => link[2]);
  const columns = header.slice(1).map((label, c) => ({
    label,
    values: rows.map((row) => (row[c + 1] ?? '').trim()),
  }));
  return { lines: spellListLines(slugs, columns) };
}

/**
 * Converts a bullet block, or explains why not.
 *
 * @param {string[]} block - Bullet lines
 * @returns {{ lines?: string[], note?: string } | null} Replacement, note, or null when not a spell list
 */
function convertBullets(block) {
  const items = block.map((line) => line.trim().match(BULLET));
  if (items.some((item) => !item)) {
    return block.some((line) => /\/en\/library\/spells\//.test(line)) ? { note: `list kept: ${block[0].trim()}` } : null;
  }
  const slugs = items.map((item) => item[2]);
  const tails = items.map((item) => (item[3] ?? '').trim());
  if (tails.every((tail) => tail === '')) return { lines: spellListLines(slugs, []) };
  if (tails.every((tail) => tail === '' || POINTS.test(tail))) {
    const values = tails.map((tail) => tail.replace(POINTS, '$1'));
    return { lines: spellListLines(slugs, [{ label: 'Cost', values }]), note: 'spell-point tails became a Cost column' };
  }
  return { note: `list kept: ${block[0].trim()}` };
}

/**
 * Converts one file.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateSpellList(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });
  if (lines.some((line) => /^<SpellList\b/.test(line))) return done(text, false, 'already has spell lists');
  if (!lines.some((line) => /\/en\/library\/spells\//.test(line))) return done(text, false, 'no spell links');

  const out = [];
  let changed = false;
  let i = 0;
  while (i < lines.length) {
    const table = /^\|/.test(lines[i]);
    const bullets = /^- \[/.test(lines[i]);
    if (!table && !bullets) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    let end = i;
    while (end < lines.length && (table ? /^\|/.test(lines[end]) : /^- /.test(lines[end]))) end += 1;
    const block = lines.slice(i, end);
    const result = table ? convertTable(block) : convertBullets(block);
    if (result?.note) notes.push(result.note);
    if (result?.lines) {
      changed = true;
      out.push(...result.lines);
    } else {
      out.push(...block);
    }
    i = end;
  }
  return done(changed ? out.join(eol) : text, changed, changed ? undefined : 'no spell table or list read');
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(migrateSpellList, ['.sheet.mdx'], 'usage: migrate-spell-list.mjs [--write] <path|glob>...');
}
