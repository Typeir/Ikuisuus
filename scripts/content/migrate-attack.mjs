/**
 * @fileoverview Lifts the attack lines of a v2 monster sheet into `<Attack>` blocks.
 * @description Inside an `<Action>`, a bullet list whose items carry an
 * accuracy line becomes one fifth-level block per item
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attribute, HEADING, runCli, trimBlank } from './migrate-shared.mjs';

const ACCURACY = /^Accuracy (\+\d+(?: \([^()]+\))?), ([^.]*?)\.\s*(.*)$/;
const BULLET = /^- \*\*(.+?)\*\*\s*(\([^)]*\))?[.:]?\s*(.*)$/;
const CONTINUATION = /^\s+\S/;

/**
 * Attributes read off an accuracy clause such as `reach [= 1 stride =], one creature`.
 *
 * @param {string} clause - Text between the accuracy and the period
 * @returns {Record<string, string> | null} Slots, or null when no reach or range is named
 */
export function readClause(clause) {
  const slots = {};
  const rest = [];
  for (const part of clause.split(/,\s*/)) {
    const both = part.match(/^reach (.+?) or range (.+)$/);
    const reach = part.match(/^reach (.+)$/);
    const range = part.match(/^range (.+)$/);
    if (both) {
      slots.reach = both[1];
      slots.range = both[2];
    } else if (reach) slots.reach = reach[1];
    else if (range) slots.range = range[1];
    else rest.push(part);
  }
  if (!slots.reach && !slots.range) return null;
  const targets = rest.join(', ').trim();
  if (targets && targets !== 'one creature') slots.targets = targets;
  for (const name of Object.keys(slots)) slots[name] = slots[name].replace(/^\*\*(.*)\*\*$/, '$1');
  return slots;
}

/**
 * The `<Attack>` opening tag for an accuracy line.
 *
 * @param {RegExpMatchArray} match - ACCURACY match
 * @returns {{ open: string, hit: string } | null} Tag and same-line hit text, or null
 */
function attackOf(match) {
  const slots = readClause(match[2]);
  if (!slots) return null;
  const attrs = ['accuracy', 'reach', 'range', 'targets']
    .filter((name) => name === 'accuracy' || slots[name] !== undefined)
    .map((name) => attribute(name, name === 'accuracy' ? match[1] : slots[name]))
    .join(' ');
  return { open: `<Attack ${attrs}>`, hit: match[3] };
}

/**
 * Lines of one attack block.
 *
 * @param {string} open - Opening tag
 * @param {string | null} heading - Heading line, or null inside a bare action
 * @param {string[]} hit - Hit prose
 * @returns {string[]} Block lines
 */
function attackBlock(open, heading, hit) {
  const body = trimBlank(hit);
  return [open, '', ...(heading ? [heading, ''] : []), ...body, ...(body.length ? [''] : []), '</Attack>'];
}

/**
 * Rewrites the bullets of one action body as blocks.
 *
 * @param {string[]} body - Lines after the heading, before `</Action>`
 * @param {number} level - Heading level of the blocks
 * @param {string[]} notes - Notes to append to
 * @returns {string[] | null} New body, or null when no bullet is an attack
 */
function promoteBullets(body, level, notes) {
  const items = [];
  let i = 0;
  while (i < body.length) {
    const label = body[i].match(BULLET);
    if (!label) {
      items.push({ lines: [body[i]] });
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < body.length && !/^- /.test(body[end])) {
      if (body[end].trim() !== '') {
        end += 1;
        continue;
      }
      let next = end + 1;
      while (next < body.length && body[next].trim() === '') next += 1;
      if (next < body.length && CONTINUATION.test(body[next]) && !/^- /.test(body[next])) {
        end = next;
        continue;
      }
      break;
    }
    const content = [label[3], ...body.slice(i + 1, end).map((line) => line.replace(/^ {1,4}/, ''))];
    items.push({ name: label[1].trim().replace(/\.$/, ''), paren: label[2], content: trimBlank(content) });
    i = end;
  }
  const attacks = items.filter((item) => item.content && ACCURACY.test(item.content[0] ?? ''));
  if (attacks.length === 0) return null;

  const hashes = '#'.repeat(Math.min(level, 6));
  const out = [];
  for (const item of items) {
    if (!item.name) {
      out.push(...item.lines);
      continue;
    }
    const heading = `${hashes} ${item.name}${item.paren ? ` ${item.paren}` : ''}`;
    const match = item.content[0]?.match(ACCURACY);
    const attack = match ? attackOf(match) : null;
    if (match && !attack) notes.push(`attack kept as prose: ${item.content[0]}`);
    if (attack) {
      if (item.paren) notes.push(`parenthetical kept on the heading: ${heading}`);
      out.push('', ...attackBlock(attack.open, heading, [attack.hit, ...item.content.slice(1)]), '');
    } else {
      out.push('', heading, '', ...item.content, '');
    }
  }
  return out;
}

/**
 * Wraps a body from its accuracy line to its end; prose before the line stays
 * outside as the action's own
 *
 * @param {string[]} body - Lines after the heading, before `</Action>`
 * @param {string[]} notes - Notes to append to
 * @returns {string[] | null} New body, or null when the body holds no attack
 */
function wrapBody(body, notes) {
  const at = body.findIndex((line) => ACCURACY.test(line));
  if (at < 0 || body.slice(0, at).some((line) => /^- /.test(line))) return null;
  const match = body[at].match(ACCURACY);
  const attack = attackOf(match);
  if (!attack) {
    notes.push(`attack kept as prose: ${body[at]}`);
    return null;
  }
  return [...body.slice(0, at), ...attackBlock(attack.open, null, [attack.hit, ...body.slice(at + 1)]), ''];
}

/**
 * Converts one sheet.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateAttack(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });
  if (!lines.some((line) => /^<Action\b/.test(line))) return done(text, false, 'no action blocks');

  const out = [];
  let changed = false;
  let i = 0;
  while (i < lines.length) {
    if (!/^<Action\b/.test(lines[i])) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    const close = lines.findIndex((line, j) => j > i && /^<\/Action>\s*$/.test(line));
    if (close < 0) {
      out.push(...lines.slice(i));
      break;
    }
    const headingAt = lines.findIndex((line, j) => j > i && j < close && HEADING.test(line));
    const level = headingAt >= 0 ? lines[headingAt].match(HEADING)[1].length + 1 : 5;
    const bodyStart = headingAt >= 0 ? headingAt + 1 : i + 1;
    const body = lines.slice(bodyStart, close);
    const rewritten = promoteBullets(body, level, notes) ?? wrapBody(body, notes);
    out.push(...lines.slice(i, bodyStart));
    if (rewritten) {
      changed = true;
      const collapsed = trimBlank(rewritten).filter((line, k, all) => !(line === '' && all[k - 1] === ''));
      out.push('', ...collapsed, '');
    } else {
      out.push(...body);
    }
    out.push(lines[close]);
    i = close + 1;
  }
  for (const line of out) {
    if (/Accuracy \+\d+/.test(line) && !/^<Attack\b/.test(line)) notes.push(`accuracy line kept as prose: ${line.trim()}`);
  }
  return done(changed ? out.join(eol) : text, changed, changed ? undefined : 'no attack lines read');
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(migrateAttack, ['.sheet.mdx'], 'usage: migrate-attack.mjs [--write] <path|glob>...');
}
