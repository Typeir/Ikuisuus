/**
 * @fileoverview Lifts a v1 bloodline page into its slot form.
 * @description Wraps the page in `<Bloodline>` carrying the boon budget, wraps
 * each `###` core feature in `<Feature>`, and turns every boon's
 * `<Collapsible>` into `<Feature collapsible>`. The two Core Features tables
 * are left exactly as written: their cells carry `<Tooltip>` blocks, which a
 * quoted attribute would flatten into literal text.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attribute, frontmatterEnd, HEADING, runCli, trimBlank } from './migrate-shared.mjs';

const CORE_HEADING = /^##\s+Core Features\s*$/;
const SECTION_HEADING = /^##\s+\S/;
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
  if (
    lines.some((line) => line.startsWith('<Bloodline')) ||
    (lines.some((line) => /^\s*<Feature collapsible\b/.test(line)) &&
      !lines.some((line) => /^\s*<Collapsible\b/.test(line)))
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
  if (!budget) notes.push('no boon budget stated');

  let body = wrapCoreFeatures(lines, notes);
  body = foldBoons(body, notes);
  if (budget) {
    const at = body.findIndex((line) => BUDGET.test(line));
    if (at >= 0) {
      const drop = body[at + 1] !== undefined && body[at + 1].trim() === '' ? 2 : 1;
      body.splice(at, drop);
    }
  }

  const head = frontmatterEnd(body);
  const opensAt = body.findIndex((line, index) => index > head && CORE_HEADING.test(line));
  const before = trimBlank(body.slice(0, opensAt));
  const rest = trimBlank(body.slice(opensAt));
  const tag = budget
    ? `<Bloodline ${attribute('boonPoints', budget.points)}>`
    : '<Bloodline>';

  const out = [...before, '', tag, '', ...rest, '', '</Bloodline>', ''];
  return { text: out.join('\n'), changed: true, notes };
}

if (process.argv[1] && basename(fileURLToPath(import.meta.url)) === basename(process.argv[1])) {
  runCli(migrateBloodline, ['.bloodline.mdx', '.boon.mdx'], 'usage: migrate-bloodline <file|dir>... [--write] [--quiet]');
}
