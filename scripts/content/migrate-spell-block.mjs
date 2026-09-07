/**
 * @fileoverview Moves a v1 spell's blockquote stat block onto the `<Spell>` form.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openingTag, runCli, titleOf, trimBlank } from './migrate-shared.mjs';

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
const OVERCAST_LINE = /^\*\*Overcast/;

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
 * Converts one spell file. Overcast lines stay in the body as prose.
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

  for (; i < inner.length; i += 1) {
    const labelled = inner[i].match(LABELLED);
    const slot = labelled && HEADER_SLOTS[labelled[1].trim().toLowerCase()];
    if (!slot) break;
    slots[slot] = labelled[2];
  }

  const body = inner.slice(i);
  if (slots.targets === undefined) {
    const firstOvercast = body.findIndex((line) => OVERCAST_LINE.test(line));
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

  const ordered = {
    level: slots.level,
    rarity: slots.rarity,
    ritual: slots.ritual,
    cost: slots.cost,
    components: slots.components,
    duration: slots.duration,
    range: slots.range,
    targets: slots.targets,
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
