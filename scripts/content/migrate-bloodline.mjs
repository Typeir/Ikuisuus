/**
 * @fileoverview Lifts a v1 bloodline page into its slot form.
 * @description Wraps the page in `<Bloodline>` carrying the boon budget, wraps
 * each `###` core feature in `<Feature>`, and turns every boon's
 * `<Collapsible>` into `<Feature collapsible>`.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attribute, cells, frontmatterEnd, HEADING, runCli, trimBlank } from './migrate-shared.mjs';

/**
 * Core Features column heading to the slot element that carries it.
 */
const COLUMN_ELEMENTS = {
  'ability scores': 'AbilityScores',
  'movement speeds': 'Speeds',
  speed: 'Speeds',
  speeds: 'Speeds',
  senses: 'Senses',
  size: 'Size',
  'creature types': 'CreatureTypes',
  'creature type': 'CreatureTypes',
  age: 'Age',
};

const CORE_HEADING = /^##\s+Core Features\s*$/;
const BOONS_HEADING = /^##\s+Boons\s*$/;
const SECTION_HEADING = /^##\s+\S/;
const DEFAULT_POINTS = 10;
const BUDGET = /^You have a budget of \*\*(\d+)\s+Boon Points\*\*\.\s*$/;
const COLLAPSIBLE_OPEN = /^(\s*)<Collapsible(\s+open)?>\s*$/;
const COLLAPSIBLE_CLOSE = /^(\s*)<\/Collapsible>\s*$/;

/**
 * The boon budget a page states, and the line that states it.
 *
 * @param {string[]} lines - Page lines
 * @returns {{ points: string, at: number } | null} Budget, or null when the page states none
 */
export function readBudget(lines) {
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(BUDGET);
    if (match) return { points: match[1], at: index };
  }
  return null;
}

/**
 * The list items of a table cell, or null when the cell is not a list.
 *
 * @param {string} cell - Cell as written
 * @returns {string[] | null} Items, or null
 */
export function listItems(cell) {
  const list = cell.match(/^<ul>([\s\S]*)<\/ul>$/);
  if (!list) return null;
  const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].trim());
  // Anything outside an item means the markup is doing something else.
  const covered = items.reduce((n, item) => n + item.length, 0);
  return list[1].replace(/<\/?li>/g, '').trim().length === covered ? items : null;
}

/**
 * The lines one Core Features cell becomes.
 *
 * @description A cell holding a list becomes an idiomatic markdown list, since
 * the raw `<ul>` was only ever there because a table cell cannot hold one.
 *
 * @param {string} element - Slot element name
 * @param {string} cell - Cell as written
 * @returns {string[]} Lines
 */
export function cellLines(element, cell) {
  const items = listItems(cell);
  if (!items) return [`<${element}>${cell}</${element}>`, ''];
  if (items.length === 1) return [`<${element}>${items[0]}</${element}>`, ''];
  return [`<${element}>`, '', ...items.map((item) => `- ${item}`), '', `</${element}>`, ''];
}

/**
 * Lifts the Core Features tables into slot elements.
 *
 * @description Each column becomes one element holding the cell exactly as
 * written, `<Tooltip>` blocks and all, which an attribute could not carry.
 *
 * @param {string[]} lines - Page lines
 * @param {string[]} notes - Notes to append to
 * @returns {string[]} Lines with the tables lifted
 */
export function liftCoreTables(lines, notes) {
  const start = lines.findIndex((line) => CORE_HEADING.test(line));
  if (start < 0) return lines;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (SECTION_HEADING.test(lines[index])) {
      end = index;
      break;
    }
  }

  const out = lines.slice(0, start + 1);
  let lifted = 0;
  for (let index = start + 1; index < end; ) {
    const header = lines[index];
    const rule = lines[index + 1] ?? '';
    const body = lines[index + 2] ?? '';
    const isTable =
      header.trimStart().startsWith('|') &&
      /^\s*\|[\s|:-]+\|\s*$/.test(rule) &&
      body.trimStart().startsWith('|');
    if (!isTable) {
      out.push(lines[index]);
      index += 1;
      continue;
    }
    const labels = cells(header).map((cell) => cell.replace(/\*\*/g, '').trim().toLowerCase());
    const written = cells(body);
    const unknown = labels.filter((label) => !COLUMN_ELEMENTS[label]);
    if (unknown.length > 0) {
      notes.push(`core table kept, unknown column: ${unknown.join(', ')}`);
      out.push(lines[index], lines[index + 1], lines[index + 2]);
      index += 3;
      continue;
    }
    for (let column = 0; column < labels.length; column += 1) {
      const element = COLUMN_ELEMENTS[labels[column]];
      out.push(...cellLines(element, (written[column] ?? '').trim()));
      lifted += 1;
    }
    index += 3;
  }
  out.push(...lines.slice(end));
  if (lifted > 0) notes.push(`core table cells lifted: ${lifted}`);
  return trimBlank(out).concat('');
}

/**
 * Wraps each `###` section under `## Core Features` in a `<Feature>` block.
 *
 * @param {string[]} lines - Page lines
 * @param {string[]} notes - Notes to append to
 * @returns {string[]} Lines with the core features wrapped
 */
export function wrapCoreFeatures(lines, notes) {
  const start = lines.findIndex((line) => CORE_HEADING.test(line));
  if (start < 0) {
    notes.push('no Core Features section');
    return lines;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (SECTION_HEADING.test(lines[index])) {
      end = index;
      break;
    }
  }

  const heads = [];
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(HEADING);
    if (match && match[1].length === 3) heads.push(index);
  }
  if (heads.length === 0) return lines;

  const out = lines.slice(0, heads[0]);
  for (let position = 0; position < heads.length; position += 1) {
    const from = heads[position];
    const to = position + 1 < heads.length ? heads[position + 1] : end;
    const body = trimBlank(lines.slice(from, to));
    // A rule closing the section belongs to the page, not to the last feature.
    const rules = [];
    while (body.length > 0 && body[body.length - 1].trim() === '---') {
      rules.unshift(body.pop());
      while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();
    }
    out.push('<Feature>', '', ...body, '', '</Feature>', '');
    for (const rule of rules) out.push(rule, '');
  }
  out.push(...lines.slice(end));
  notes.push(`core features wrapped: ${heads.length}`);
  return out;
}

/**
 * Rewrites already-lifted cells that still hold a raw list.
 *
 * @param {string[]} lines - Page lines
 * @param {string[]} notes - Notes to append to
 * @returns {string[]} Lines with those cells relisted
 */
export function relistCells(lines, notes) {
  const names = new Set(Object.values(COLUMN_ELEMENTS));
  const out = [];
  let relisted = 0;
  for (const line of lines) {
    const match = line.match(/^<([A-Z][A-Za-z]*)>([\s\S]*)<\/\1>\s*$/);
    if (!match || !names.has(match[1]) || !/^<ul>/.test(match[2])) {
      out.push(line);
      continue;
    }
    const rendered = cellLines(match[1], match[2]);
    out.push(...rendered.slice(0, -1));
    relisted += 1;
  }
  if (relisted > 0) notes.push(`cells relisted: ${relisted}`);
  return out;
}

/**
 * Wraps the Boons section in a `<Boons>` block.
 *
 * @description The budget sentence goes with it: every bloodline grants the
 * same points, so the component states them and the page says nothing.
 *
 * @param {string[]} lines - Page lines
 * @param {string[]} notes - Notes to append to
 * @param {string | null} points - Budget the page stated, when it had one
 * @returns {string[]} Lines with the section wrapped
 */
export function wrapBoons(lines, notes, points) {
  const start = lines.findIndex((line) => BOONS_HEADING.test(line));
  if (start < 0) return lines;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    // The enclosing host's closing tag ends the section, as the next heading does.
    if (SECTION_HEADING.test(lines[index]) || /^<\/Bloodline>\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const body = trimBlank(lines.slice(start, end)).filter((line) => !BUDGET.test(line));
  const tag =
    points !== null && Number(points) !== DEFAULT_POINTS
      ? `<Boons ${attribute('points', points)}>`
      : '<Boons>';
  notes.push(points === null ? 'boons wrapped, no budget stated' : `boons wrapped, budget ${points}`);
  return [
    ...lines.slice(0, start),
    tag,
    '',
    ...body,
    '',
    '</Boons>',
    '',
    ...lines.slice(end),
  ];
}

/**
 * Turns each boon `<Collapsible>` into a `<Feature collapsible>`.
 *
 * @param {string[]} lines - Page lines
 * @param {string[]} notes - Notes to append to
 * @returns {string[]} Lines with the boons rewritten
 */
export function foldBoons(lines, notes) {
  let count = 0;
  const out = lines.map((line) => {
    const open = line.match(COLLAPSIBLE_OPEN);
    if (open) {
      count += 1;
      return `${open[1]}<Feature collapsible${open[2] ? ' open' : ''}>`;
    }
    const close = line.match(COLLAPSIBLE_CLOSE);
    if (close) return `${close[1]}</Feature>`;
    return line;
  });
  if (count > 0) notes.push(`boons folded into features: ${count}`);
  return out;
}

/**
 * Converts a bloodline page to its slot form.
 *
 * @param {string} text - File source
 * @param {string} [file] - File path, for the notes
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateBloodline(text, file) {
  const lines = text.split('\n');
  const notes = [];
  // A page already wrapped may still have its Core Features tables written as
  // tables, so the lift runs on its own.
  if (lines.some((line) => line.startsWith('<Bloodline'))) {
    let again = liftCoreTables(lines, notes);
    again = relistCells(again, notes);
    if (!again.some((line) => line.startsWith('<Boons'))) {
      const points = readBudget(again);
      again = wrapBoons(again, notes, points ? points.points : null);
    }
    const at = again.findIndex((line) => line.startsWith('<Bloodline'));
    if (at >= 0 && again[at] !== '<Bloodline>') {
      const close = again.findIndex((line, i) => i >= at && line.trimEnd().endsWith('>'));
      again.splice(at, close - at + 1, '<Bloodline>');
      notes.push('boon budget dropped from the bloodline tag');
    }
    return notes.length > 0
      ? { text: again.join('\n'), changed: true, notes }
      : { text, changed: false, skipped: 'already a bloodline block', notes };
  }
  if (
    lines.some((line) => /^\s*<Feature collapsible\b/.test(line)) &&
    !lines.some((line) => /^\s*<Collapsible\b/.test(line))
  ) {
    return { text, changed: false, skipped: 'already a bloodline block', notes };
  }
  const core = lines.findIndex((line) => CORE_HEADING.test(line));
  // A shared boon list has boons but no bloodline of its own, so it takes the
  // collapsible fold and no wrapper.
  if (core < 0) {
    const folded = foldBoons(lines, notes);
    const changed = notes.length > 0;
    return changed
      ? { text: folded.join('\n'), changed, notes }
      : { text, changed: false, skipped: 'no Core Features section and no boons', notes };
  }

  const budget = readBudget(lines);

  let body = liftCoreTables(lines, notes);
  body = wrapCoreFeatures(body, notes);
  body = foldBoons(body, notes);
  body = wrapBoons(body, notes, budget ? budget.points : null);

  const head = frontmatterEnd(body);
  const opensAt = body.findIndex((line, index) => index > head && CORE_HEADING.test(line));
  const before = trimBlank(body.slice(0, opensAt));
  const rest = trimBlank(body.slice(opensAt));

  const out = [...before, '', '<Bloodline>', '', ...rest, '', '</Bloodline>', ''];
  return { text: out.join('\n'), changed: true, notes };
}

if (process.argv[1] && basename(fileURLToPath(import.meta.url)) === basename(process.argv[1])) {
  runCli(migrateBloodline, ['.bloodline.mdx', '.boon.mdx'], 'usage: migrate-bloodline <file|dir>... [--write] [--quiet]');
}
