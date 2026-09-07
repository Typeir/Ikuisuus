/**
 * @fileoverview Moves a v1 feat onto the `<Feat>` form.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attribute,
  collapseBlank,
  frontmatterEnd,
  HEADING,
  headingSlots,
  openingTag,
  runCli,
  trimBlank,
} from './migrate-shared.mjs';

const PREREQUISITE = /^_Prer+equisites?:\s*(.+?)_\s*$/i;
const NO_PREREQUISITE = /^_No (?:attribute )?prerequisite\.?_\s*$/i;
const ORIGIN = /^_Origin Feat_\s*$/i;
const ITALIC = /^_.+_\s*$/;
const REPEATABLE_KEY = /^(?:multiSelect|repeatable):\s*true/;
const ABILITY_NAME =
  '\\**(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\\**';
const ABILITY = new RegExp(
  `^Increase your \\**\\s*(${ABILITY_NAME}(?:,\\s*${ABILITY_NAME})*(?:,?\\s+or\\s+${ABILITY_NAME})?)\\s*(?:score\\s*)?by 1\\**(?:,?\\s*(?:up )?to a maximum of \\**\\d+\\**)?\\.?\\s*$`,
);

/**
 * Wraps `####` headings in `<Feature>` blocks.
 *
 * @param {string[]} lines - Body lines
 * @returns {string[]} Wrapped body
 */
function wrapFeatures(lines) {
  const out = [];
  let open = false;
  const close = () => {
    if (!open) return;
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    out.push('', '</Feature>', '');
    open = false;
  };
  for (const line of lines) {
    const heading = line.match(HEADING);
    if (heading && heading[1].length === 4) {
      close();
      const { title, slots } = headingSlots(heading[2]);
      const attrs = Object.entries(slots)
        .map(([name, value]) => ' ' + attribute(name, value))
        .join('');
      out.push(`<Feature${attrs}>`, '', `#### ${title}`);
      open = true;
      continue;
    }
    if (heading || /^---/.test(line)) close();
    out.push(line);
  }
  close();
  return out;
}

/**
 * Converts one feat file.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateFeat(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });

  if (lines.some((line) => /^<Feat\b/.test(line))) {
    return done(text, false, 'already on the slot form');
  }
  const titleAt = lines.findIndex((line) => /^# /.test(line));
  if (titleAt < 0) return done(text, false, 'no title');

  const slots = {};
  const consumed = new Set();
  const fmEnd = frontmatterEnd(lines);
  const flagAt = lines.findIndex((line, i) => i < fmEnd && REPEATABLE_KEY.test(line));
  if (flagAt >= 0) slots.repeatable = true;

  for (let i = titleAt + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') continue;
    if (!ITALIC.test(line)) break;
    const prerequisite = line.match(PREREQUISITE);
    if (prerequisite) {
      slots.prerequisite = prerequisite[1];
      consumed.add(i);
      continue;
    }
    if (ORIGIN.test(line)) {
      slots.category = 'origin';
      consumed.add(i);
      continue;
    }
    if (NO_PREREQUISITE.test(line)) {
      consumed.add(i);
      continue;
    }
    if (/prerequisite/i.test(line)) {
      notes.push(`kept as prose: ${line.trim()}`);
      continue;
    }
    break;
  }

  lines.forEach((line, i) => {
    if (i <= titleAt) return;
    const ability = line.match(ABILITY);
    if (ability && slots.ability === undefined) {
      slots.ability = ability[1].replace(/\*/g, '').replace(/\s+/g, ' ').trim();
      consumed.add(i);
    } else if (/^Increase your\b/.test(line)) {
      notes.push(`ability line kept as prose: ${line.trim()}`);
    }
  });

  const head = lines.slice(0, titleAt + 1).filter((_, i) => i !== flagAt);
  const epic = lines[titleAt].match(/^# Epic Boon:\s*(.+?)\s*$/i);
  if (epic) {
    slots.category = 'epic boon';
    head[titleAt] = `# ${epic[1]}`;
  }

  const ordered = {
    category: slots.category,
    prerequisite: slots.prerequisite,
    ability: slots.ability,
    repeatable: slots.repeatable,
  };
  const body = lines.slice(titleAt + 1).filter((_, j) => !consumed.has(titleAt + 1 + j));

  const out = [
    ...head,
    '',
    ...openingTag('Feat', ordered),
    '',
    ...trimBlank(wrapFeatures(collapseBlank(body))),
    '',
    '</Feat>',
    '',
  ].join(eol);
  return done(out, true);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(migrateFeat, ['.feat.mdx'], 'usage: migrate-feat.mjs [--write] <path|glob>...');
}
