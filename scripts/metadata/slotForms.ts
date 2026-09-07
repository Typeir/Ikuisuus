/**
 * @fileoverview Reads slot-form content back into the line shapes the metadata
 * generators parse.
 * @description The generators read v1 markdown: a spell's blockquote header,
 * a monster's tables and bullets, a feat's italic prerequisite, a trinket's
 * bold stat lines, a vocation's core traits table and `## Nth Level – Name`
 * headings.
 *
 * @module scripts/metadata/slotForms
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

/**
 * A host or block tag read off the page.
 *
 * @property {string} name - Tag name
 * @property {Record<string, string | true>} attrs - Attributes; a bare flag is `true`
 * @property {number} start - First line index
 * @property {number} end - Last line index of the opening tag
 */
export interface HostTag {
  name: string;
  attrs: Record<string, string | true>;
  start: number;
  end: number;
}

const TAG_OPEN = /^<([A-Z]\w*)\b/;
const ATTRIBUTE = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;
const BLOCK_LINE = /^<\/?(?:Trait|Action|Feature|Overcast|Attack|SpellList)\b[^>]*>\s*$/;
const TABLE_LINE = /^\s*(?:<\/?Column\b[^>]*>|<Row\b[^>]*>.*<\/Row>)\s*$/;
const OVERCAST_INLINE = /^<Overcast(?:\s+at=(?:"([^"]*)"|'([^']*)'))?>(.*)<\/Overcast>\s*$/;
const OVERCAST_OPEN = /^<Overcast(?:\s+at=(?:"([^"]*)"|'([^']*)'))?>\s*$/;

/**
 * Reads the tag that opens on a line: its name, attributes and line span.
 *
 * @param {string[]} lines - File lines
 * @param {number} start - Line the tag opens on
 * @returns {HostTag | null} The tag, or null when the line opens none
 */
export function readHostTag(lines: string[], start: number): HostTag | null {
  const open = lines[start]?.match(TAG_OPEN);
  if (!open) return null;
  let end = start;
  while (end < lines.length && !/>\s*$/.test(lines[end])) end += 1;
  if (end >= lines.length) return null;
  const text = lines
    .slice(start, end + 1)
    .join(' ')
    .replace(/^<\w+/, '')
    .replace(/\/?>\s*$/, '');
  const attrs: Record<string, string | true> = {};
  for (const match of text.matchAll(ATTRIBUTE)) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return { name: open[1], attrs, start, end };
}

/**
 * Text of an attribute, or undefined for a flag or an absent one.
 *
 * @param {HostTag} tag - Tag
 * @param {string} name - Attribute name
 * @returns {string | undefined} Trimmed text
 */
export function textAttr(tag: HostTag, name: string): string | undefined {
  const value = tag.attrs[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Replaces the lines `start..end` with `replacement`, padded with blank lines
 * so the file never gets shorter.
 *
 * @param {string[]} lines - File lines, mutated
 * @param {number} start - First line to replace
 * @param {number} end - Last line to replace
 * @param {string[]} replacement - New lines
 */
export function splice(lines: string[], start: number, end: number, replacement: string[]): void {
  const span = end - start + 1;
  const padded = [...replacement];
  while (padded.length < span) padded.push('');
  lines.splice(start, span, ...padded);
}

/**
 * Ordinal of a whole number: 1st, 2nd, 3rd, 4th, 11th, 21st.
 *
 * @param {number} value - Number
 * @returns {string} Ordinal
 */
export function ordinal(value: number): string {
  const rest = value % 100;
  if (rest >= 11 && rest <= 13) return `${value}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[value % 10] ?? 'th';
  return `${value}${suffix}`;
}

/**
 * Word with its first letter upper-cased.
 *
 * @param {string} word - Word
 * @returns {string} Capitalised word
 */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Index of the first line opening the named tag, or -1.
 *
 * @param {string[]} lines - File lines
 * @param {string} name - Tag name
 * @param {number} [from] - Line to start from
 * @returns {number} Line index
 */
export function findTag(lines: string[], name: string, from = 0): number {
  const pattern = new RegExp(`^<${name}\\b`);
  for (let i = from; i < lines.length; i += 1) if (pattern.test(lines[i])) return i;
  return -1;
}

/**
 * Blanks every line that is only a block tag: `<Trait …>`, `</Action>`,
 * `<Feature …>`, `</Overcast>` and the like.
 *
 * @param {string[]} lines - File lines, mutated
 */
function blankBlockTags(lines: string[]): void {
  for (let i = 0; i < lines.length; i += 1) if (BLOCK_LINE.test(lines[i])) lines[i] = '';
}

/**
 * Restores a spell's blockquote header from its `<Spell>` tag and writes its
 * `<Overcast>` elements as the `**Overcast:**` lines the generator reads.
 *
 * @param {string} text - File text, frontmatter blanked or present
 * @returns {string} Text on the v1 form
 */
export function unslotSpell(text: string): string {
  const lines = text.split('\n');
  const at = findTag(lines, 'Spell');
  if (at < 0) return text;
  const tag = readHostTag(lines, at);
  if (!tag) return text;

  const header: string[] = [];
  const level = textAttr(tag, 'level');
  if (level !== undefined) {
    if (/^(?:cantrip|0)$/i.test(level)) header.push('> _Cantrip_');
    else {
      const rarity = textAttr(tag, 'rarity');
      const rare = rarity && rarity.toLowerCase() !== 'common' ? ` ${capitalize(rarity)}` : '';
      const ritual = tag.attrs.ritual === true || tag.attrs.ritual === 'true' ? ' (Ritual)' : '';
      const number = Number(level);
      const phrase = Number.isFinite(number) ? ordinal(number) : level;
      header.push(`> _${phrase}-Level${rare} Spell${ritual}_`);
    }
  }
  const labels: Array<[string, string]> = [
    ['cost', 'Casting Time'],
    ['components', 'Components'],
    ['duration', 'Duration'],
    ['range', 'Range'],
    ['targets', 'Targets'],
  ];
  for (const [slot, label] of labels) {
    const value = textAttr(tag, slot);
    if (value !== undefined) header.push(`> **${label}**: ${value}`);
  }
  splice(lines, tag.start, tag.end, header);

  const overcast = textAttr(tag, 'overcast');
  for (let i = 0; i < lines.length; i += 1) {
    const inline = lines[i].match(OVERCAST_INLINE);
    if (inline) {
      const tier = inline[1] ?? inline[2];
      lines[i] = `**Overcast${tier ? ` (${tier})` : ''}:** ${inline[3].trim()}`;
      continue;
    }
    const open = lines[i].match(OVERCAST_OPEN);
    if (open) {
      const tier = open[1] ?? open[2];
      lines[i] = `**Overcast${tier ? ` (${tier})` : ''}:**`;
      continue;
    }
    if (/^<\/Spell>\s*$/.test(lines[i])) {
      lines[i] = overcast ? `**Overcast:** ${overcast}` : '';
    }
  }
  blankBlockTags(lines);
  return lines.join('\n');
}

/**
 * Writes every `<Attack>` tag back as the accuracy sentence the generator
 * reads, and blanks the `<SpellList>` columns and rows around it.
 *
 * @param {string[]} lines - File lines, mutated
 */
function restoreAttacks(lines: string[]): void {
  let from = 0;
  for (;;) {
    const at = findTag(lines, 'Attack', from);
    if (at < 0) break;
    const tag = readHostTag(lines, at);
    if (!tag) break;
    const reach = textAttr(tag, 'reach');
    const range = textAttr(tag, 'range');
    const span = [reach && `reach ${reach}`, range && `range ${range}`].filter(Boolean).join(' or ');
    const parts = [`Accuracy ${textAttr(tag, 'accuracy') ?? ''}`.trim(), span, textAttr(tag, 'targets') ?? 'one creature'];
    splice(lines, tag.start, tag.end, [`${parts.filter(Boolean).join(', ')}.`]);
    from = tag.start + 1;
  }
  for (let i = 0; i < lines.length; i += 1) if (TABLE_LINE.test(lines[i])) lines[i] = '';
}

/**
 * Tier bonus a challenge rating implies: one step per three, floor one.
 *
 * @param {string} challenge - Rating text
 * @returns {number | null} Bonus, or null when unreadable
 */
function tierBonusFor(challenge: string): number | null {
  const fraction = challenge.match(/^(\d+)\/(\d+)/);
  const value = fraction
    ? Number(fraction[1]) / Number(fraction[2])
    : Number(challenge.match(/^\d+/)?.[0]);
  return Number.isFinite(value) ? Math.max(1, Math.ceil(value / 3)) : null;
}

/**
 * Restores a monster's identity line, defence and ability tables and header
 * bullets from each `<Monster>` tag on the page.
 *
 * @param {string} text - File text
 * @returns {string} Text on the v1 form
 */
export function unslotMonster(text: string): string {
  const lines = text.split('\n');
  if (findTag(lines, 'Monster') < 0) return text;

  let from = 0;
  for (;;) {
    const at = findTag(lines, 'Monster', from);
    if (at < 0) break;
    const tag = readHostTag(lines, at);
    if (!tag) break;
    const get = (name: string): string | undefined => textAttr(tag, name);
    const header: string[] = [];

    const size = get('size');
    const type = get('type');
    const alignment = get('alignment');
    if (size && type && alignment) header.push(`_${size} ${type}, ${alignment}_`, '');

    const armorClass = get('armorClass');
    const hitPoints = get('hitPoints');
    const speed = get('speed');
    if (armorClass || hitPoints || speed) {
      header.push(
        '| **Armor Class** | **Hit Points** | **Speed** |',
        '| --- | --- | --- |',
        `| ${armorClass ?? ''} | ${hitPoints ?? ''} | ${speed ?? ''} |`,
        '',
      );
    }

    const scores = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(get);
    if (scores.some((score) => score !== undefined)) {
      header.push(
        '| STR | DEX | CON | INT | WIS | CHA |',
        '| --- | --- | --- | --- | --- | --- |',
        `| ${scores.map((score) => score ?? '').join(' | ')} |`,
        '',
      );
    }

    const challenge = get('challenge');
    if (challenge) {
      const xp = get('xp');
      header.push(`- **Challenge**: ${challenge}${xp ? ` (${xp} XP)` : ''}`);
      const derived = tierBonusFor(challenge);
      const tierBonus = get('tierBonus') ?? (derived === null ? undefined : `+${derived}`);
      if (tierBonus) header.push(`- **Tier Bonus**: ${tierBonus}`);
    }
    const bullets: Array<[string, string]> = [
      ['saves', 'Saving Throws'],
      ['skills', 'Skills'],
      ['resistances', 'Damage Resistances'],
      ['vulnerabilities', 'Damage Vulnerabilities'],
      ['immunities', 'Damage Immunities'],
      ['conditionImmunities', 'Condition Immunities'],
      ['senses', 'Senses'],
      ['languages', 'Languages'],
    ];
    for (const [slot, label] of bullets) {
      const value = get(slot);
      if (value !== undefined) header.push(`- **${label}**: ${value}`);
    }

    splice(lines, tag.start, tag.end, header);
    from = tag.start + Math.max(header.length, tag.end - tag.start + 1);
  }
  for (let i = 0; i < lines.length; i += 1) if (/^<\/Monster>\s*$/.test(lines[i])) lines[i] = '';
  restoreAttacks(lines);
  blankBlockTags(lines);
  return lines.join('\n');
}

/**
 * Whether the `<Feat>` tag carries the repeatable flag.
 *
 * @param {string} text - File text
 * @returns {boolean} True when repeatable
 */
export function featRepeatable(text: string): boolean {
  const lines = text.split('\n');
  const at = findTag(lines, 'Feat');
  if (at < 0) return false;
  const value = readHostTag(lines, at)?.attrs.repeatable;
  return value === true || value === 'true';
}

/**
 * Restores a feat's italic prerequisite line and its ability sentence from
 * the `<Feat>` tag.
 *
 * @param {string} text - File text
 * @returns {string} Text on the v1 form
 */
export function unslotFeat(text: string): string {
  const lines = text.split('\n');
  const at = findTag(lines, 'Feat');
  if (at < 0) return text;
  const tag = readHostTag(lines, at);
  if (!tag) return text;

  const prerequisite = textAttr(tag, 'prerequisite');
  splice(lines, tag.start, tag.end, prerequisite ? [`_Prerequisite: ${prerequisite}_`] : []);

  const ability = textAttr(tag, 'ability');
  for (let i = 0; i < lines.length; i += 1) {
    if (/^<\/Feat>\s*$/.test(lines[i])) {
      lines[i] = ability ? `Increase your ${ability} score by 1.` : '';
    }
  }
  blankBlockTags(lines);
  return lines.join('\n');
}

/**
 * Unwraps the blocks a bloodline conversion added.
 *
 * @description The generator reads the Core Features values and the boon
 * budget off the slots themselves, so only the boons need restoring: it
 * delimits one from the next by the collapsible around it, so a collapsible
 * feature is written back as `<Collapsible>` while every other added tag is
 * blanked in place. Line count is preserved, because a boon records the line
 * range it covers.
 *
 * @param {string} text - File text
 * @returns {string} Text the boon parser reads as it always did
 */
export function unslotBloodline(text: string): string {
  const lines = text.split('\n');
  if (findTag(lines, 'Bloodline') < 0) return text;

  const open: boolean[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*<\/?(?:Bloodline|Boons)\b[^>]*>\s*$/.test(line)) {
      lines[i] = '';
      continue;
    }
    const opening = line.match(/^\s*<Feature\b([^>]*)>\s*$/);
    if (opening) {
      const collapsible = /\bcollapsible\b/.test(opening[1]);
      open.push(collapsible);
      lines[i] = collapsible
        ? `<Collapsible${/\bopen\b/.test(opening[1]) ? ' open' : ''}>`
        : '';
      continue;
    }
    if (/^\s*<\/Feature>\s*$/.test(line)) {
      lines[i] = open.pop() ? '</Collapsible>' : '';
    }
  }
  blankBlockTags(lines);
  return lines.join('\n');
}

/**
 * Restores a trinket's category line under the title and its bold stat lines
 * at the end from the `<Trinket>` tag.
 *
 * @param {string} text - File text
 * @returns {string} Text on the v1 form
 */
export function unslotTrinket(text: string): string {
  const lines = text.split('\n');
  const at = findTag(lines, 'Trinket');
  if (at < 0) return text;
  const tag = readHostTag(lines, at);
  if (!tag) return text;

  const category = textAttr(tag, 'category');
  splice(lines, tag.start, tag.end, category ? [category] : []);

  const stats: Array<[string, string]> = [
    ['damage', 'Damage'],
    ['properties', 'Properties'],
    ['range', 'Range'],
    ['burden', 'Weight'],
  ];
  const statLines = stats
    .map(([slot, label]) => [label, textAttr(tag, slot)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
    .map(([label, value]) => `**${label}**: ${value}`);
  const close = lines.findIndex((line) => /^<\/Trinket>\s*$/.test(line));
  if (close >= 0) lines.splice(close, 1, ...(statLines.length ? statLines : ['']));
  return lines.join('\n');
}
