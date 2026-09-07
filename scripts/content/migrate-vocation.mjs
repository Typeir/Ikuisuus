/**
 * @fileoverview Moves a vocation's core traits table onto the `<Vocation>`
 * form and its level headings onto `<Feature level="N">` blocks.
 */

import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cells, openingTag, runCli, trimBlank } from './migrate-shared.mjs';

/**
 * Core traits row label → vocation slot.
 */
export const TRAIT_SLOTS = {
  'primary ability': 'primaryAbility',
  'primary abilities': 'primaryAbility',
  'hit point die': 'hitDie',
  'saving throw proficiencies': 'saves',
  'skill proficiencies': 'skills',
  'trade proficiencies': 'trades',
  'weapon proficiencies': 'weapons',
  'armor training': 'armor',
  'starting equipment': 'equipment',
};

/**
 * Slot → element name, for values that must be written in element form.
 */
const ELEMENT_NAMES = {
  primaryAbility: 'PrimaryAbility',
  hitDie: 'HitDie',
  saves: 'Saves',
  skills: 'Skills',
  trades: 'Trades',
  weapons: 'Weapons',
  armor: 'Armor',
  equipment: 'Equipment',
};

const SLOT_ORDER = Object.values(ELEMENT_NAMES).map(
  (name) => name[0].toLowerCase() + name.slice(1),
);
const ROW = /^\|\s*\*\*([^*]+?)\*\*\s*\|/;
const CORE_HEADING = /^## Core\b.*Traits\s*$/;
const LEVEL_HEADING = /^## (\d+)(?:st|nd|rd|th) Level [–—-] (.+?)\s*$/;
const OTHER_LEVEL_HEADING = /^## .*\bLevel\b/;

/**
 * Replaces the core traits table with the opening tag, keeping its heading as
 * the tag's first child so the card prints it above the table it draws.
 *
 * @param {string[]} lines - File lines
 * @param {string[]} notes - Notes to append to
 * @returns {string[] | null} New lines, or null when nothing changed
 */
function liftTraitsTable(lines, notes) {
  const firstRow = lines.findIndex((line) => {
    const row = line.match(ROW);
    return row && TRAIT_SLOTS[row[1].trim().toLowerCase()];
  });
  if (firstRow < 0) return null;

  let start = firstRow;
  while (start > 0 && /^\|/.test(lines[start - 1])) start -= 1;
  let end = firstRow;
  while (end + 1 < lines.length && /^\|/.test(lines[end + 1])) end += 1;

  const slots = {};
  const elements = [];
  for (let i = start; i <= end; i += 1) {
    const row = lines[i].match(ROW);
    if (!row) continue;
    const slot = TRAIT_SLOTS[row[1].trim().toLowerCase()];
    if (!slot) {
      notes.push(`core traits table kept: unknown row ${row[1].trim()}`);
      return null;
    }
    const value = cells(lines[i])[1] ?? '';
    if (/</.test(value)) elements.push(`<${ELEMENT_NAMES[slot]}>${value}</${ELEMENT_NAMES[slot]}>`);
    else slots[slot] = value;
  }

  let headingAt = start - 1;
  while (headingAt > 0 && lines[headingAt].trim() === '') headingAt -= 1;
  const heading = CORE_HEADING.test(lines[headingAt] ?? '') ? lines[headingAt] : null;
  const removeFrom = heading ? headingAt : start;

  const ordered = Object.fromEntries(SLOT_ORDER.map((name) => [name, slots[name]]));

  return [
    ...trimBlank(lines.slice(0, removeFrom)),
    '',
    ...openingTag('Vocation', ordered),
    '',
    ...(heading ? [heading, ''] : []),
    ...(elements.length ? [...elements, ''] : []),
    ...trimBlank(lines.slice(end + 1)),
    '',
    '</Vocation>',
  ];
}

/**
 * Wraps `## Nth Level – Name` sections in `<Feature level="N">` blocks.
 *
 * @param {string[]} lines - File lines
 * @param {string[]} notes - Notes to append to
 * @returns {{ lines: string[], changed: boolean }} New lines
 */
function wrapLevelFeatures(lines, notes) {
  const out = [];
  let open = false;
  let changed = false;
  const close = () => {
    if (!open) return;
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    const rule = out.length && /^---/.test(out[out.length - 1]) ? out.pop() : null;
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    out.push('', '</Feature>', '');
    if (rule) out.push(rule, '');
    open = false;
  };
  for (const line of lines) {
    const level = line.match(LEVEL_HEADING);
    if (level) {
      close();
      if (out.length && out[out.length - 1].trim() !== '') out.push('');
      out.push(`<Feature level="${level[1]}">`, '', `## ${level[2]}`);
      open = true;
      changed = true;
      continue;
    }
    if (
      /^#{1,2} /.test(line) ||
      /^<\/?Collapsible\b/.test(line) ||
      /^<\/(?:Vocation|Specialization)>/.test(line)
    ) {
      close();
    }
    if (OTHER_LEVEL_HEADING.test(line)) notes.push(`heading kept: ${line.trim()}`);
    out.push(line);
  }
  close();
  return { lines: out, changed };
}

/**
 * Wraps a specialization page in its host tag, the parent read from the
 * folder name.
 *
 * @param {string[]} lines - File lines
 * @param {string} parent - Parent vocation slug
 * @returns {string[] | null} New lines, or null when there is no title to open after
 */
function wrapSpecialization(lines, parent) {
  const titleAt = lines.findIndex((line) => /^# /.test(line));
  if (titleAt < 0) return null;
  return [
    ...lines.slice(0, titleAt + 1),
    '',
    `<Specialization vocation="${parent}">`,
    '',
    ...trimBlank(lines.slice(titleAt + 1)),
    '',
    '</Specialization>',
  ];
}

/**
 * Converts one vocation or specialization file.
 *
 * @param {string} text - File contents
 * @param {string} [file] - File path; a `.specialization.mdx` path names the parent folder
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateVocation(text, file) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });
  let lines = text.split(/\r?\n/);
  let changed = false;

  if (file && /\.specialization\.mdx$/.test(file)) {
    if (lines.some((line) => /^<Specialization\b/.test(line))) {
      notes.push('already wrapped in its host tag');
    } else {
      const wrapped = wrapSpecialization(lines, basename(dirname(file)));
      if (wrapped) {
        lines = wrapped;
        changed = true;
      } else {
        notes.push('no title to open the host tag after');
      }
    }
  } else if (lines.some((line) => /^<Vocation\b/.test(line))) {
    notes.push('core traits already on the slot form');
  } else {
    const lifted = liftTraitsTable(lines, notes);
    if (lifted) {
      lines = lifted;
      changed = true;
    }
  }

  if (lines.some((line) => /^<Feature\b/.test(line))) {
    notes.push('level features already wrapped');
  } else {
    const wrapped = wrapLevelFeatures(lines, notes);
    lines = wrapped.lines;
    changed = changed || wrapped.changed;
  }

  if (!changed) return done(text, false, 'nothing to move');
  return done([...trimBlank(lines), ''].join(eol), true);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(
    migrateVocation,
    ['.vocation.mdx', '.specialization.mdx'],
    'usage: migrate-vocation.mjs [--write] <path|glob>...',
  );
}
