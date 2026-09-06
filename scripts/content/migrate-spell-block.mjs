/**
 * @fileoverview Moves a v1 spell's blockquote stat block onto the `<Spell>` form.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontmatterEnd, openingTag, runCli, titleOf, trimBlank } from './migrate-shared.mjs';

/**
 * Blockquote header label → spell slot.
 */
export const HEADER_SLOTS = {
  'casting time': 'cost',
  components: 'components',
  duration: 'duration',
  range: 'range',
  targets: 'targets',
};

const CASTING_TIME = /^> \*\*Casting Time\*\*/;
const LABELLED = /^\*\*([^*]+?)\*\*:\s*(.*?)\s*$/;
const NAME_LINE = /^\*\*(.+?)\*\*\s*$/;
const CANTRIP = /^_cantrip_\s*$/i;
const LEVELLED = /^_(\d+)(?:st|nd|rd|th)-level (legendary )?spell(?: \((ritual)\))?_\s*$/i;
const OVERCAST = /^\*\*Overcast(?: \(([^()]*)\))?:(?: ([^*]+?))?\*\*\s*(.*)$/;
const SCHOOL_ASPECT = /^\s*-\s*school:(\S+)\s*$/;

/**
 * Text with markdown emphasis and surrounding space removed, for comparing a
 * blockquote's name line with the title.
 *
 * @param {string} text - Text
 * @returns {string} Bare text
 */
function bare(text) {
  return text.replace(/[*_]/g, '').trim().toLowerCase();
}

/**
 * Splits the body at its overcast lines into `<Overcast>` elements.
 *
 * @param {string[]} body - Unquoted body lines
 * @param {string[]} notes - Notes to append to
 * @returns {{ body: string[], overcast?: string }} Rewritten body, and the
 * attribute value when a lone closing line took that form
 */
function liftOvercast(body, notes) {
  const marks = [];
  body.forEach((line, i) => {
    if (!/^\*\*Overcast/.test(line)) return;
    const match = line.match(OVERCAST);
    if (!match) {
      notes.push(`overcast line kept as prose: ${line.trim()}`);
      return;
    }
    const text = match[2] ? `**${match[2]}** ${match[3]}` : match[3];
    marks.push({ at: i, tier: match[1], text: text.trim() ? text : '', named: Boolean(match[2]) });
  });
  if (marks.length === 0) return { body };

  const only = marks[0];
  const tailIsBlank = body.slice(only.at + 1).every((line) => line.trim() === '');
  if (marks.length === 1 && !only.tier && !only.named && only.text && tailIsBlank) {
    return { body: body.slice(0, only.at), overcast: only.text.trim() };
  }

  const out = [];
  let i = 0;
  while (i < body.length) {
    const mark = marks.find((m) => m.at === i);
    if (!mark) {
      out.push(body[i]);
      i += 1;
      continue;
    }
    const open = mark.tier ? `<Overcast at="${mark.tier}">` : '<Overcast>';
    const owns = mark.tier || !mark.text;
    let end = i + 1;
    if (owns) {
      while (end < body.length && !marks.some((m) => m.at === end)) end += 1;
    }
    const content = trimBlank([mark.text, ...body.slice(i + 1, end)].filter((l) => l !== undefined));
    if (content.length === 1 && !/^\|/.test(content[0])) {
      out.push(`${open}${content[0].trim()}</Overcast>`);
    } else {
      out.push(open, '', ...content, '', '</Overcast>');
    }
    i = end;
  }
  return { body: out };
}

/**
 * Converts one spell file.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateSpellBlock(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes = [];
  const done = (out, changed, skipped) => ({ text: out, changed, skipped, notes });

  if (lines.some((line) => /^<Spell\b/.test(line))) {
    return done(text, false, 'already on the slot form');
  }
  const anchors = lines.map((line, i) => (CASTING_TIME.test(line) ? i : -1)).filter((i) => i >= 0);
  if (anchors.length === 0) return done(text, false, 'no blockquote stat block');
  if (anchors.length > 1) return done(text, false, `${anchors.length} stat blocks; convert by hand`);

  let start = anchors[0];
  while (start > 0 && /^>/.test(lines[start - 1])) start -= 1;
  let end = anchors[0];
  while (end + 1 < lines.length && /^>/.test(lines[end + 1])) end += 1;

  const inner = lines
    .slice(start, end + 1)
    .map((line) => line.replace(/^> ?/, ''))
    .map((line) => (line.trim() === '' ? '' : line));

  const slots = {};
  let i = 0;
  while (i < inner.length && inner[i] === '') i += 1;

  const name = inner[i]?.match(NAME_LINE);
  if (name && bare(name[1]) === bare(titleOf(lines))) i += 1;
  else if (name) notes.push(`name line kept as prose: ${inner[i].trim()}`);

  if (inner[i] && CANTRIP.test(inner[i])) {
    slots.level = 'cantrip';
    i += 1;
  } else {
    const level = inner[i]?.match(LEVELLED);
    if (level) {
      slots.level = level[1];
      if (level[2]) slots.rarity = 'legendary';
      if (level[3]) slots.ritual = true;
      i += 1;
    } else {
      notes.push('no level line read');
    }
  }

  const fmEnd = frontmatterEnd(lines);
  const schools = lines
    .slice(0, fmEnd < 0 ? 0 : fmEnd)
    .map((line) => line.match(SCHOOL_ASPECT)?.[1])
    .filter(Boolean);
  if (schools.length === 1) slots.school = schools[0];
  else if (schools.length > 1) notes.push(`several school aspects (${schools.join(', ')}); none copied`);

  for (; i < inner.length; i += 1) {
    const labelled = inner[i].match(LABELLED);
    const slot = labelled && HEADER_SLOTS[labelled[1].trim().toLowerCase()];
    if (!slot) break;
    slots[slot] = labelled[2];
  }

  let body = inner.slice(i);
  if (slots.targets === undefined) {
    const firstOvercast = body.findIndex((line) => /^\*\*Overcast/.test(line));
    const at = body.findIndex((line, j) => {
      const labelled = line.match(LABELLED);
      return labelled && labelled[1].trim().toLowerCase() === 'targets' && (firstOvercast < 0 || j < firstOvercast);
    });
    if (at >= 0) {
      slots.targets = body[at].match(LABELLED)[2];
      body.splice(at, 1);
      notes.push('targets line found after the header; lifted');
    }
  }

  const lifted = liftOvercast(trimBlank(body), notes);
  body = lifted.body;
  const ordered = {
    level: slots.level,
    rarity: slots.rarity,
    school: slots.school,
    ritual: slots.ritual,
    cost: slots.cost,
    components: slots.components,
    duration: slots.duration,
    range: slots.range,
    targets: slots.targets,
    overcast: lifted.overcast,
  };

  const head = trimBlank(lines.slice(0, start));
  const tail = trimBlank(lines.slice(end + 1));
  const out = [
    ...head,
    '',
    ...openingTag('Spell', ordered),
    '',
    ...trimBlank(body),
    '',
    '</Spell>',
    ...(tail.length ? ['', ...tail] : []),
    '',
  ].join(eol);
  return done(out, true);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(
    migrateSpellBlock,
    ['.spell.mdx'],
    'usage: migrate-spell-block.mjs [--write] <path|glob>...',
  );
}
