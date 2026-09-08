/**
 * @fileoverview Vocation and specialization slot-form shim.
 * @description Restores a vocation's core traits table and `## Nth Level –
 * Name` headings
 *
 * @module scripts/metadata/vocationForms
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { findTag, ordinal, readHostTag, splice, textAttr } from './slotForms';

const ELEMENT_SLOT = /^<([A-Z]\w*)>(.*)<\/\1>\s*$/;
const FEATURE_OPEN = /^<Feature\b([^>]*)>\s*$/;
const CORE_HEADING = /^## Core\b.*Traits\s*$/;

const TRAIT_ROWS: Array<[string, string]> = [
  ['primaryAbility', 'Primary Ability'],
  ['hitDie', 'Hit Point Die'],
  ['saves', 'Saving Throw Proficiencies'],
  ['skills', 'Skill Proficiencies'],
  ['trades', 'Trade Proficiencies'],
  ['weapons', 'Weapon Proficiencies'],
  ['armor', 'Armor Training'],
  ['equipment', 'Starting Equipment'],
];

/**
 * Reads element-form slots written in the paragraph after a tag
 *
 * @param {string[]} lines - File lines
 * @param {number} from - Line after the opening tag
 * @returns {{ slots: Record<string, string>, end: number }} Slots keyed by
 * lower-camel name, and the last line consumed (`from - 1` when none)
 */
export function readElementSlots(
  lines: string[],
  from: number,
): { slots: Record<string, string>; end: number } {
  const slots: Record<string, string> = {};
  let i = from;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  let end = from - 1;
  for (; i < lines.length; i += 1) {
    const match = lines[i].match(ELEMENT_SLOT);
    if (!match) break;
    slots[match[1][0].toLowerCase() + match[1].slice(1)] = match[2].trim();
    end = i;
  }
  return { slots, end };
}

/**
 * The parent vocation a `<Specialization vocation="…">` tag names.
 *
 * @param {string} text - File text
 * @returns {string | undefined} Parent slug, or undefined without the tag
 */
export function parentVocationOf(text: string): string | undefined {
  const lines = text.split('\n');
  const at = findTag(lines, 'Specialization');
  const tag = at >= 0 ? readHostTag(lines, at) : null;
  return tag ? textAttr(tag, 'vocation') : undefined;
}

/**
 * Restores a vocation's core traits table from the `<Vocation>` tag and its
 * element-form slots
 *
 * @param {string} text - File text
 * @returns {string} Text on the v1 form
 */
export function unslotVocation(text: string): string {
  const lines = text.split('\n');
  let changed = false;

  const specAt = findTag(lines, 'Specialization');
  const spec = specAt >= 0 ? readHostTag(lines, specAt) : null;
  if (spec) {
    splice(lines, spec.start, spec.end, []);
    changed = true;
  }

  const at = findTag(lines, 'Vocation');
  const tag = at >= 0 ? readHostTag(lines, at) : null;
  if (tag) {
    let next = tag.end + 1;
    while (next < lines.length && lines[next].trim() === '') next += 1;
    const headingAt = CORE_HEADING.test(lines[next] ?? '') ? next : -1;
    const elements = readElementSlots(lines, headingAt >= 0 ? headingAt + 1 : tag.end + 1);
    const values: Record<string, string | undefined> = { ...elements.slots };
    for (const [slot] of TRAIT_ROWS) values[slot] = textAttr(tag, slot) ?? values[slot];
    const rows = TRAIT_ROWS.filter(([slot]) => values[slot] !== undefined).map(
      ([slot, label]) => `| **${label}** | ${values[slot]} |`,
    );
    const table = rows.length ? ['| Trait | Value |', ...rows] : [];
    const end = Math.max(tag.end, headingAt, elements.end);
    splice(lines, tag.start, end, headingAt >= 0 ? [lines[headingAt], '', ...table] : table);
    changed = true;
  }

  for (let i = 0; i < lines.length; i += 1) {
    if (/^<\/(?:Vocation|Specialization)>\s*$/.test(lines[i])) {
      lines[i] = '';
      changed = true;
      continue;
    }
    const open = lines[i].match(FEATURE_OPEN);
    if (!open) continue;
    const level = open[1].match(/\blevel=(?:"(\d+)"|'(\d+)')/);
    const value = level ? level[1] ?? level[2] : undefined;
    lines[i] = '';
    changed = true;
    if (value === undefined) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j += 1;
    const heading = lines[j]?.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (heading && !/\bLevel\b/.test(heading[2])) {
      lines[j] = `${heading[1]} ${ordinal(Number(value))} Level – ${heading[2]}`;
    }
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (/^<\/Feature>\s*$/.test(lines[i])) {
      lines[i] = '';
      changed = true;
    }
  }
  return changed ? lines.join('\n') : text;
}
