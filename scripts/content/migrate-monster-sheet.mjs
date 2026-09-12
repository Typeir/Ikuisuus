/**
 * @fileoverview Moves a v1 monster sheet onto the `<Monster>` slot form.
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attribute,
  cells,
  collapseBlank,
  HEADING,
  headingSlots,
  openingTag,
  runCli,
  trimBlank,
} from './migrate-shared.mjs';

/**
 * Header bullet label → monster slot.
 */
export const BULLET_SLOTS = {
  'saving throws': 'saves',
  skills: 'skills',
  'damage resistances': 'resistances',
  'damage vulnerabilities': 'vulnerabilities',
  'damage immunities': 'immunities',
  'condition immunities': 'conditionImmunities',
  senses: 'senses',
  languages: 'languages',
  'spell save dc': 'saveDc',
};

/**
 * Section heading → block tag, plus the slots every block in it carries.
 */
export const SECTION_BLOCKS = [
  { test: /^traits?$/i, tag: 'Trait', slots: {} },
  { test: /^(?:major )?actions$/i, tag: 'Action', slots: {} },
  { test: /^minor actions$/i, tag: 'Action', slots: { cost: '1 Minor Action' } },
  { test: /^reactions$/i, tag: 'Action', slots: { cost: '1 Reaction' } },
  { test: /^legendary deeds?: act$/i, tag: 'Action', slots: { deed: 'act' } },
  { test: /^legendary deeds?: phase$/i, tag: 'Action', slots: { deed: 'phase' } },
  { test: /^legendary deeds?: stratagem$/i, tag: 'Action', slots: { deed: 'stratagem' } },
  { test: /^legendary deeds?: lair$/i, tag: 'Action', slots: { deed: 'lair' } },
  { test: /^legendary deeds?: resist$/i, tag: 'Action', slots: { deed: 'resist' } },
];

const IDENTITY = /^_([A-Z][\w-]+) ([^,()_]+?)(?: \(([^)]+)\))?, ([^_]+?)_\s*$/;
const AC_HEADER = /^\|\s*\*\*Armor Class\*\*/;
const STR_HEADER = /^\|\s*\*{0,2}STR\*{0,2}\s*\|/;
const BULLET = /^- \*\*([^*]+?)\*\*:?\s*(.*?)\s*$/;
const SCORE = /^(\d+)\s*\([^)]*\)$/;
const LETHALITY = /^(\d+(?:\/\d+)?)(?:\s*\(([\d,.]+)\s*XP\))?$/i;
const SAVE_DC = /spell save dc\**\s*:?\s*\**\s*(\d+)/gi;

/**
 * Tier bonus the lethality implies
 *
 * @param {string} lethality - Rating text
 * @returns {number | null} Bonus, or null when unreadable
 */
export function tierBonusFor(lethality) {
  const fraction = lethality.match(/^(\d+)\/(\d+)/);
  const value = fraction
    ? Number(fraction[1]) / Number(fraction[2])
    : Number(lethality.match(/^\d+/)?.[0]);
  return Number.isFinite(value) ? Math.max(1, Math.ceil(value / 3)) : null;
}

/**
 * Reads the v1 header
 *
 * @param {string[]} lines - File lines
 * @returns {object} Slots, consumed indices, tag position, body start and notes — or a skip reason
 */
function readHeader(lines) {
  const notes = [];
  const slots = {};
  const consumed = new Set();

  const acIndex = lines.findIndex((line) => AC_HEADER.test(line));
  if (acIndex === -1 || !lines[acIndex + 2]) {
    return { skipped: 'no Armor Class / Hit Points / Speed table' };
  }

  let tagAt = acIndex;
  for (let i = acIndex - 1; i > 0; i--) {
    const match = lines[i].match(IDENTITY);
    if (match) {
      tagAt = i;
      slots.size = match[1];
      slots.type = match[3] ? `${match[2]} (${match[3]})` : match[2];
      slots.alignment = match[4].trim();
      consumed.add(i);
      break;
    }
    if (HEADING.test(lines[i])) break;
  }
  if (tagAt === acIndex) {
    notes.push('identity line not read; size, type and alignment stay as prose');
  }

  const [armorClass, hitPoints, speed] = cells(lines[acIndex + 2]);
  if (armorClass) slots.armorClass = armorClass;
  if (hitPoints) slots.hitPoints = hitPoints;
  if (speed) slots.speed = speed;
  [acIndex, acIndex + 1, acIndex + 2].forEach((i) => consumed.add(i));

  let cursor = acIndex + 3;
  const strIndex = lines.findIndex((line, i) => i > acIndex && STR_HEADER.test(line));
  if (strIndex !== -1 && lines[strIndex + 2]) {
    const scores = cells(lines[strIndex + 2]);
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((name, i) => {
      const raw = scores[i] ?? '';
      const plain = raw.match(SCORE);
      if (plain) slots[name] = plain[1];
      else if (/^\d+$/.test(raw)) slots[name] = raw;
      else if (raw) {
        slots[name] = raw;
        notes.push(`${name} kept as written: ${raw}`);
      }
    });
    [strIndex, strIndex + 1, strIndex + 2].forEach((i) => consumed.add(i));
    cursor = strIndex + 3;
  } else {
    notes.push('no ability score table');
  }

  let tierBonus;
  let bodyAt = cursor;
  for (let i = cursor; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const bullet = line.match(BULLET);
    if (!bullet) break;
    bodyAt = i + 1;
    const label = bullet[1].trim().toLowerCase();
    const value = bullet[2];
    if (label === 'lethality') {
      const match = value.match(LETHALITY);
      if (match) {
        slots.lethality = match[1];
        if (match[2]) slots.xp = match[2];
      } else {
        slots.lethality = value;
        notes.push(`lethality kept as written: ${value}`);
      }
      consumed.add(i);
    } else if (label === 'tier bonus') {
      tierBonus = value.trim();
      consumed.add(i);
    } else if (BULLET_SLOTS[label]) {
      slots[BULLET_SLOTS[label]] = value;
      consumed.add(i);
    } else {
      notes.push(`header bullet left in the body: ${bullet[1]}`);
    }
  }

  if (tierBonus !== undefined) {
    const derived = slots.lethality ? tierBonusFor(slots.lethality) : null;
    if (derived === null || `+${derived}` !== tierBonus) {
      slots.tierBonus = tierBonus;
      const gives = derived === null ? 'nothing' : `+${derived}`;
      notes.push(`tier bonus ${tierBonus} kept: the rating gives ${gives}`);
    }
  }

  return { slots, consumed, tagAt, bodyAt, notes };
}

/**
 * Wraps feature headings under known sections in blocks.
 *
 * @param {string[]} lines - Body lines, header removed
 * @param {string[]} notes - Notes to append to
 * @returns {string[]} Wrapped body
 */
function wrapBody(lines, notes) {
  const out = [];
  let section = null;
  let sectionTitle = '';
  let open = null;
  const unwrapped = new Set();

  const closeBlock = () => {
    if (!open) return;
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    out.push('', `</${open}>`, '');
    open = null;
  };

  for (const line of lines) {
    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length;
      if (level <= 3) {
        closeBlock();
        section = SECTION_BLOCKS.find((rule) => rule.test.test(heading[2])) ?? null;
        sectionTitle = heading[2];
        out.push(line);
        continue;
      }
      if (section) {
        closeBlock();
        const { title, slots } = headingSlots(heading[2], section.slots);
        const attrs = Object.entries(slots)
          .map(([name, value]) => ' ' + attribute(name, value))
          .join('');
        out.push(`<${section.tag}${attrs}>`, '', `${heading[1]} ${title}`);
        open = section.tag;
        continue;
      }
      if (sectionTitle) unwrapped.add(sectionTitle);
    }
    if (/^---/.test(line)) closeBlock();
    out.push(line);
  }
  closeBlock();
  for (const title of unwrapped) notes.push(`features under "${title}" left unwrapped`);
  return out;
}

/**
 * Converts one sheet.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, changed: boolean, skipped?: string, notes: string[] }} Result
 */
export function migrateMonsterSheet(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const done = (out, changed, skipped, notes = []) => ({ text: out, changed, skipped, notes });

  if (lines.some((line) => /^<Monster\b/.test(line))) {
    return done(text, false, 'already on the slot form');
  }
  const blocks = lines.filter((line) => /^- \*\*Lethality\*\*/.test(line)).length;
  if (blocks > 1) return done(text, false, `${blocks} stat blocks; convert by hand`);

  const header = readHeader(lines);
  if ('skipped' in header) return done(text, false, header.skipped);
  const { slots, consumed, tagAt, bodyAt, notes } = header;

  const dcs = [...text.matchAll(SAVE_DC)].map((m) => m[1]);
  if (dcs.length && !slots.saveDc) {
    slots.saveDc = dcs[0];
    const distinct = [...new Set(dcs)];
    if (distinct.length > 1) {
      notes.push(`several spell save DCs (${distinct.join(', ')}); saveDc took the first`);
    }
  }

  const head = [];
  const body = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const strayBullet = i > tagAt && BULLET.test(lines[i]);
    if (i < bodyAt && !strayBullet) head.push(lines[i]);
    else body.push(lines[i]);
  }

  const out = [
    ...trimBlank(collapseBlank(head)),
    '',
    ...openingTag('Monster', slots),
    '',
    ...trimBlank(wrapBody(body, notes)),
    '',
    '</Monster>',
    '',
  ].join(eol);
  return done(out, true, undefined, notes);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  runCli(
    migrateMonsterSheet,
    ['.sheet.mdx'],
    'usage: migrate-monster-sheet.mjs [--write] <path|glob>...',
  );
}
