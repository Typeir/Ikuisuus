/**
 * @fileoverview Splits every monster's declared AC into Dodge and Deflect.
 * @description Defence is 10 + Deflect + Dodge. A monster's Dodge is its
 * Dexterity modifier unless the armour named on the sheet caps it or a shield
 * adds to it, so Deflect is what the declared AC leaves above 10; sheets whose
 * numbers do not reconcile are flagged
 *
 * @module scripts/content/derive-monster-defence
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');
const REPORT = resolve(ROOT, '.ignore/reports/monster-defence-split.md');
const ROWS = resolve(ROOT, '.ignore/reports/monster-defence-split.json');

/**
 * Where the sweep reads.
 */
const PATTERNS = ['src/content/en/monsters/*.sheet.mdx'];

/**
 * Where `--apply` rewrites AC slots, sheets and the Statlets outside them.
 */
const APPLY_PATTERNS = ['src/content/en/**/*.mdx'];

/**
 * The floor every Defence stands on: Defence is 10 + Deflect + Dodge.
 */
const BASE = 10;

/**
 * Armour words and the Dexterity cap each imposes.
 *
 * @description Heavy armour takes no Dexterity, medium takes two, everything
 * else takes it all
 */
const CAPS = [
  {
    cap: 0,
    words: /\b(?:(?<!half )(?<!half)plate|splint|ring mail|chain mail|godplate)\b/i,
  },
  {
    cap: 2,
    words: /\b(?:hide|scales?|breastplate|half ?(?:plate|palte)|chain shirt|spiked|harness|mail)\b/i,
  },
];

/**
 * Shield words and what each adds to Dodge.
 */
const SHIELDS = [
  { bonus: 3, words: /\bgreatshield\b/i },
  { bonus: 2, words: /\bshield\b/i },
  { bonus: 1, words: /\bbuckler\b/i },
];

/**
 * Words that name worn armour in a parenthetical.
 */
const WORN =
  /\b(?:plate|mail|splint|breastplate|harness|barding|leather|gambeson|padded|(?<!no |mage )armou?r)\b/i;

/**
 * Where a Deflect comes from.
 *
 * @description Worn when the slot names armour that is put on; natural for
 * everything else, since a creature that deflects by nature has natural armour
 * @param {string} source - The parenthetical
 * @returns {string} worn or natural
 */
export function deflectSource(source) {
  if (/natural/i.test(source)) return 'natural';
  return WORN.test(source) ? 'worn' : 'natural';
}

/**
 * The armour page, whose rows a declared AC may land on.
 */
const ARMOUR_PAGE = 'src/content/en/items/equipment/armour.rule.mdx';

/**
 * Reads the armour rows off the armour page.
 *
 * @param {string} source - The page's text
 * @returns {Array<{name: string, base: number, dex: string}>} Each row's
 * name, flat AC (10 plus its Deflect), and how it takes Dexterity from its
 * Max Dodge column: full for a dash, max2 for 2, none for 0
 */
export function armourRows(source) {
  const rows = [];
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\| ([^|]+?)\s*\| (\d+)\s*\| (—|\d+)\s*\|/);
    if (!match) continue;
    rows.push({
      name: match[1].replace(/\[# kw:([^#]+) #\]/, '$1').trim(),
      base: 10 + Number(match[2]),
      dex: match[3] === '—' ? 'full' : Number(match[3]) === 0 ? 'none' : 'max2',
    });
  }
  if (/^## Clothing\b/m.test(source)) {
    rows.push({ name: 'Clothing', base: 10, dex: 'full' });
  }
  return rows;
}

/**
 * Quality rungs, one point of AC each.
 */
const RUNGS = {
  '-4': 'Ruined',
  '-3': 'Degraded',
  '-2': 'Worn',
  '-1': 'Shoddy',
  0: '',
  1: 'Enhanced',
  2: 'Superior',
  3: 'Supreme',
  4: 'Perfected',
  5: 'True',
};

/**
 * Every armour row that reproduces a declared AC within the rung ladder.
 *
 * @param {number} ac - Declared AC
 * @param {number} dexMod - Dexterity modifier
 * @param {Array<{name: string, base: number, dex: string}>} rows - Armour rows
 * @returns {Array<{row: object, rung: number, wasted: number, label: string}>}
 * Candidates, nearest Mundane first, least wasted Dexterity next, heaviest
 * base last
 */
export function candidatesFor(ac, dexMod, rows) {
  return rows
    .map((row) => {
      const allowed =
        row.dex === 'full' ? dexMod : row.dex === 'max2' ? Math.min(dexMod, 2) : 0;
      const rung = ac - row.base - allowed;
      return {
        row,
        rung,
        wasted: dexMod - allowed,
        label: `${RUNGS[rung] ?? ''} ${row.name}`.trim(),
      };
    })
    .filter((entry) => entry.rung >= -4 && entry.rung <= 5)
    .sort(
      (a, b) =>
        Math.abs(a.rung) - Math.abs(b.rung) ||
        a.wasted - b.wasted ||
        b.row.base - a.row.base,
    );
}

/**
 * Reads a worn row's named armour off the armour page, with its rung.
 *
 * @description The parenthetical names the armour; the rung is what the
 * declared AC leaves after that row, Dexterity as it allows, and any shield.
 * A name the page has no row for is read back as written
 * @param {object} row - A derived worn row with `source`, `ac`, `dex`, `shield`
 * @param {Array<{name: string, base: number, dex: string}>} armour - Armour rows
 * @returns {string[]} One reading
 */
export function wornReading(row, armour) {
  if (row.ac === null || row.dex === null) return [];
  const named = namedArmour(row.source, armour);
  if (!named) return row.source ? [row.source] : [];
  const parts = wornParts(row, named);
  if (parts.armourRung < -4 || parts.armourRung > 5) {
    return [`${named.name} (${parts.armourRung >= 0 ? '+' : ''}${parts.armourRung}, off the ladder)`];
  }
  const out = [`${RUNGS[parts.armourRung]} ${named.name}`.trim()];
  if (parts.shieldName) out.push(`${RUNGS[parts.shieldRung]} ${parts.shieldName}`.trim());
  if (parts.defense) out.push('Defense');
  return out;
}

/**
 * The armour row a parenthetical names.
 *
 * @param {string} source - The parenthetical
 * @param {Array<{name: string, base: number, dex: string}>} armour - Armour rows
 * @returns {(object|undefined)} The longest row name the text contains
 */
export function namedArmour(source, armour) {
  const text = source.toLowerCase().replace(/half ?(?:plate|palte)/, 'halfplate');
  return armour
    .filter((entry) => text.includes(entry.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

/**
 * How a worn slot's AC divides between its armour, its shield and Defense.
 *
 * @description The Defense style is one point. A rung word before the shield
 * is read as its rung; otherwise, when the armour alone would sit above True,
 * the excess is split evenly between armour and shield, since a creature that
 * upgraded one upgraded the other
 * @param {object} row - A derived row with `ac`, `dex`, `source`
 * @param {{name: string, base: number, dex: string}} named - Its armour row
 * @returns {{armourRung: number, shieldName: (string|null), shieldBase: number,
 * shieldRung: number, defense: number}} The parts
 */
export function wornParts(row, named) {
  const source = row.source;
  const defense = /\bdefen[cs]e\b/i.test(source) ? 1 : 0;
  const shieldMatch = source.match(
    /\b(?:(Enhanced|Superior|Supreme|Perfected|True)\s+)?(Greatshield|Shield|Buckler)\b/i,
  );
  const shieldName = shieldMatch ? shieldMatch[2][0].toUpperCase() + shieldMatch[2].slice(1).toLowerCase() : null;
  const shieldBase = shieldName ? SHIELDS.find((entry) => entry.words.test(shieldName)).bonus : 0;
  let shieldRung = shieldMatch?.[1]
    ? Number(Object.keys(RUNGS).find((key) => RUNGS[key].toLowerCase() === shieldMatch[1].toLowerCase()))
    : 0;
  const dexMod = modifier(row.dex);
  const allowed =
    named.dex === 'full' ? dexMod : named.dex === 'max2' ? Math.min(dexMod, 2) : 0;
  let armourRung = row.ac - shieldBase - shieldRung - defense - named.base - allowed;
  if (shieldName && !shieldMatch[1] && armourRung > 5) {
    shieldRung = Math.floor(armourRung / 2);
    armourRung -= shieldRung;
  }
  return { armourRung, shieldName, shieldBase, shieldRung, defense };
}

/**
 * Whether a row's creature could plausibly wear armour.
 *
 * @param {object} row - A derived row with `type` and `int`
 * @returns {boolean} True for a Humanoid or a creature with Intelligence 10+
 */
export function couldWearArmour(row) {
  return /humanoid/i.test(row.type ?? '') || (row.int ?? 0) >= 10;
}

/**
 * The choice list: every natural-armour creature that could wear armour, with
 * its candidate rows to tick.
 *
 * @param {object[]} rows - Derived rows
 * @param {Array<{name: string, base: number, dex: string}>} armour - Armour rows
 * @returns {string} Markdown, one section per stat block
 */
export function choiceList(rows, armour, caps = []) {
  const out = [
    '# Monster armour choices',
    '',
    'One section per creature that could wear armour and whose sheet names none. Write V inside the brackets of the row it wears, or of the natural-armour line. The script reads the marks back with `--choices`.',
    '',
  ];
  for (const row of rows) {
    if (row.from !== 'natural' || row.ac === null || row.dex === null) continue;
    if (!couldWearArmour(row)) continue;
    const dexMod = modifier(row.dex);
    const tier = tierOf(row.lethality ?? null);
    const cap = tierCap(tier, caps);
    const all = candidatesFor(row.ac, dexMod, armour);
    const options = [
      ...all.filter((entry) => entry.rung <= cap),
      ...all.filter((entry) => entry.rung > cap).sort((a, b) => a.rung - b.rung),
    ];
    const sign = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
    out.push(
      `## ${row.name}${row.tag > 1 ? ` (${row.tag})` : ''} — AC ${row.ac}, Dex ${row.dex} (${sign}), ${row.type ?? '?'}, Int ${row.int ?? '?'}, lethality ${row.lethality ?? '?'} (tier ${tier ?? '?'}, up to ${RUNGS[cap] || 'Mundane'})`,
      '',
    );
    for (const entry of options) {
      const marks = [];
      if (row.fits.reading.includes(entry.label)) marks.push('script');
      if (entry.wasted > 0) marks.push(`wastes ${entry.wasted} Dex`);
      if (entry.rung > cap) marks.push('above the tier');
      out.push(`- [ ] ${entry.label}${marks.length > 0 ? `  (${marks.join(', ')})` : ''}`);
    }
    out.push('- [ ] natural armour', ...SHIELD_LINES, '');
  }
  return out.join('\n');
}

/**
 * The shield lines every section ends with, ticked independently of armour.
 */
const SHIELD_LINES = [
  '- [ ] carries a shield',
  '- [ ] carries a greatshield',
  '- [ ] carries a buckler',
  '- [ ] Defence fixed by trait',
];

/**
 * The tick line, or slot word, that pins a creature's Defence at the floor.
 */
const FIXED_CHOICE = 'Defence fixed by trait';

/**
 * Whether a parenthetical pins the Defence at the floor.
 *
 * @param {string} source - The parenthetical
 * @returns {boolean} True for "fixed" or "uncaring"
 */
export function fixedBySlot(source) {
  return /\b(?:fixed|uncaring)\b/i.test(source);
}

/**
 * Dodge a ticked shield line adds.
 */
const SHIELD_CHOICES = {
  'carries a shield': 2,
  'carries a greatshield': 3,
  'carries a buckler': 1,
};

/**
 * Every tag whose declared AC sits under its lethality band, worst first.
 *
 * @param {object[]} rows - Derived rows carrying `lethality` and `ac`
 * @returns {string} Markdown table of AC against 10 + 2 × TB
 */
export function underBandTable(rows) {
  const entries = rows
    .filter((row) => row.ac !== null && row.lethality !== null)
    .map((row) => {
      const tb = tierOf(row.lethality);
      const band = 10 + 2 * tb;
      return { row, tb, band, offset: row.ac - band };
    })
    .filter((entry) => entry.offset < 0)
    .sort((a, b) => a.offset - b.offset || b.tb - a.tb);
  return [
    '# Monster AC under its band',
    '',
    `${entries.length} tags sit below 10 + 2 × TB, worst first. Band is what the tier alone gives; the offset is how far the sheet sits under it.`,
    '',
    '| Sheet | AC | Lethality | TB | Band | Offset | Dex | Dodge | Deflect | Deflect from | Reads as |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |',
    ...entries.map(
      ({ row, tb, band, offset }) =>
        `| ${row.name}${row.tag > 1 ? ` (${row.tag})` : ''} | ${row.ac} | ${row.lethality} | ${tb} | ${band} | ${offset} | ${row.dex ?? '—'} | ${row.dodge ?? '—'} | ${row.deflect ?? '—'} | ${row.from ?? '—'} | ${(row.fits?.reading ?? []).join(', ')} |`,
    ),
    '',
  ].join('\n');
}

/**
 * Reads the ticked lines of a choice list.
 *
 * @param {string} text - The list with marks written in
 * @returns {Map<string, {armour: (string|null), shield: number}>} Per section
 * key, the ticked armour label (`natural armour` for that line) and the Dodge
 * of any ticked shield line
 */
export function readChoices(text) {
  const chosen = new Map();
  let key = null;
  for (const line of text.split(/\r?\n/)) {
    const section = line.match(/^## (.+?) — /);
    if (section) {
      key = section[1];
      chosen.set(key, { armour: null, shield: 0 });
      continue;
    }
    const tick = line.match(/^- \[[VvXx]\] (.+?)(?:\s{2}\(.*)?$/);
    if (!tick || !key) continue;
    const label = tick[1].trim();
    const entry = chosen.get(key);
    if (label in SHIELD_CHOICES) entry.shield = Math.max(entry.shield, SHIELD_CHOICES[label]);
    else if (label === FIXED_CHOICE) entry.fixed = true;
    else if (entry.armour === null) entry.armour = label;
  }
  for (const [name, entry] of chosen) {
    if (entry.armour === null && entry.shield === 0 && !entry.fixed) chosen.delete(name);
  }
  return chosen;
}

/**
 * Armour rows that reproduce a declared AC at some quality rung.
 *
 * @description Each row takes Dexterity as it allows; the rung is what is
 * left. `closest` keeps the rows nearest Mundane; `unwasted` keeps, among rows
 * that let the creature use all of its Dexterity, the ones nearest Mundane
 * @param {number} ac - Declared AC
 * @param {number} dexMod - Dexterity modifier
 * @param {Array<{name: string, base: number, dex: string}>} rows - Armour rows
 * @returns {{closest: string[], unwasted: string[], reading: string[],
 * overCap: boolean}} Fits as `Rung Row`; at huge Dexterity `reading` is the
 * row wasting the least of it whatever its rung, otherwise the nearest Mundane
 * at Superior or below where any row fits there, and `overCap` says the
 * reading sits above Superior
 */
export function fits(ac, dexMod, rows, cap = LOOT_CAP) {
  const candidates = candidatesFor(ac, dexMod, rows);
  const nearest = (list) => {
    if (list.length === 0) return [];
    const best = Math.min(...list.map((entry) => Math.abs(entry.rung)));
    return list
      .filter((entry) => Math.abs(entry.rung) === best)
      .map((entry) => `${RUNGS[entry.rung]} ${entry.row.name}`.trim());
  };
  const closest = nearest(candidates);
  const unwasted = nearest(candidates.filter((entry) => entry.wasted <= 0));
  const inCap = candidates.filter((entry) => entry.rung <= cap);
  const leastWasted = (list) => {
    if (list.length === 0) return [];
    const least = Math.min(...list.map((entry) => entry.wasted));
    return nearest(list.filter((entry) => entry.wasted === least));
  };
  const reading =
    dexMod >= HUGE_DEX
      ? leastWasted(candidates)
      : inCap.length === 0
        ? nearest(candidates)
        : nearest(inCap);
  const overCap = candidates
    .filter((entry) => reading.includes(entry.label))
    .some((entry) => entry.rung > cap);
  return { closest, unwasted, reading, overCap };
}

/**
 * Dexterity from which wasting it under heavy armour stops being plausible.
 */
const HUGE_DEX = 4;

/**
 * The highest rung a reading may use when no band is known.
 */
const LOOT_CAP = 2;

/**
 * Tier groups the quality percentiles are taken over.
 *
 * @description Low tiers are numerous enough to stand alone; the high ones
 * are pooled so a percentile means something
 */
const TIER_GROUPS = [
  { label: '1', min: 1, max: 1 },
  { label: '2', min: 2, max: 2 },
  { label: '3', min: 3, max: 3 },
  { label: '4', min: 4, max: 4 },
  { label: '5-7', min: 5, max: 7 },
  { label: '8-9', min: 8, max: 9 },
  { label: '10+', min: 10, max: Infinity },
];

/**
 * Tier group a tier bonus belongs to.
 *
 * @param {(number|null)} tb - Tier bonus
 * @returns {(object|null)} The group, or null without a tier
 */
export function groupOf(tb) {
  if (tb === null) return null;
  return TIER_GROUPS.find((group) => tb >= group.min && tb <= group.max) ?? null;
}

/**
 * Nearest-rank percentile of a list of numbers.
 *
 * @param {number[]} values - Numbers
 * @param {number} p - Percentile, 0 to 100
 * @returns {(number|null)} The value at that rank, or null for an empty list
 */
export function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

/**
 * The quality rung each tier group may reach, read off the corpus.
 *
 * @description For every natural-armour creature with a tier, the rung of its
 * nearest-Mundane fit is taken; each group's allowance is the given percentile
 * of those rungs, clamped to Mundane at the bottom and True at the top
 * @param {object[]} rows - Derived rows carrying `lethality`, `ac`, `dex`, `from`
 * @param {Array<{name: string, base: number, dex: string}>} armour - Armour rows
 * @param {number} p - Percentile, 0 to 100
 * @returns {Array<{label: string, n: number, p50: (number|null),
 * p75: (number|null), p90: (number|null), cap: number}>} One entry per group
 */
export function tierCaps(rows, armour, p) {
  return TIER_GROUPS.map((group) => {
    const rungs = [];
    for (const row of rows) {
      if (row.from !== 'natural' || row.ac === null || row.dex === null) continue;
      const tb = tierOf(row.lethality ?? null);
      if (tb === null || tb < group.min || tb > group.max) continue;
      const nearest = candidatesFor(row.ac, modifier(row.dex), armour)[0];
      if (nearest) rungs.push(nearest.rung);
    }
    const at = percentile(rungs, p);
    return {
      label: group.label,
      n: rungs.length,
      p50: percentile(rungs, 50),
      p75: percentile(rungs, 75),
      p90: percentile(rungs, 90),
      cap: at === null ? LOOT_CAP : Math.max(0, Math.min(5, at)),
    };
  });
}

/**
 * The highest quality rung a creature of a given tier bonus wears.
 *
 * @param {(number|null)} tb - Tier bonus, from lethality
 * @param {Array<{label: string, cap: number}>} caps - Allowances by group
 * @returns {number} The group's allowance, or Superior without a tier
 */
export function tierCap(tb, caps = []) {
  const group = groupOf(tb);
  if (!group) return LOOT_CAP;
  return caps.find((entry) => entry.label === group.label)?.cap ?? LOOT_CAP;
}

/**
 * Tier bonus for a lethality.
 *
 * @param {(number|null)} lethality - The sheet's lethality
 * @returns {(number|null)} max(1, ceil(lethality / 3)), or null
 */
export function tierOf(lethality) {
  return lethality === null ? null : Math.max(1, Math.ceil(lethality / 3));
}

/**
 * Ability modifier for a score.
 *
 * @param {number} score - Ability score
 * @returns {number} Modifier
 */
export function modifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Reads a sheet's armorClass value.
 *
 * @param {string} value - The slot's raw value
 * @returns {{ac: (number|null), source: string, multi: boolean}} The first
 * number, the parenthetical, and whether more than one value is given
 */
export function parseArmorClass(value) {
  const outside = value.replace(/\([^)]*\)/g, ' ');
  const numbers = [...outside.matchAll(/\d+/g)].map((match) =>
    Number(match[0]),
  );
  const source = [...value.matchAll(/\(([^)]*)\)/g)]
    .map((match) => match[1].trim())
    .join('; ');
  return {
    ac: numbers.length > 0 ? numbers[0] : null,
    source,
    multi: numbers.length > 1,
  };
}

/**
 * Dexterity cap the named armour imposes.
 *
 * @param {string} source - The parenthetical
 * @returns {(number|null)} 0 for heavy, 2 for medium, null for no cap
 */
export function capFor(source) {
  for (const { cap, words } of CAPS) {
    if (words.test(source)) return cap;
  }
  return null;
}

/**
 * Dodge the named shield adds.
 *
 * @param {string} source - The parenthetical
 * @returns {number} 3, 2, 1 or 0
 */
export function shieldFor(source) {
  for (const { bonus, words } of SHIELDS) {
    if (words.test(source)) return bonus;
  }
  return 0;
}

/**
 * Splits one sheet's numbers.
 *
 * @param {{ac: (number|null), dex: (number|null), source: string,
 * multi: boolean}} sheet - What the slot says
 * @returns {{dodge: (number|null), deflect: (number|null), cap: (number|null),
 * shield: number, notes: string[]}} The split and why it may be wrong
 */
export function derive(sheet, armour = []) {
  const notes = [];
  if (sheet.ac === null) notes.push('no AC');
  if (sheet.dex === null) notes.push('no Dexterity');
  if (sheet.multi) notes.push('more than one AC');
  if (sheet.ac === null || sheet.dex === null) {
    return { dodge: null, deflect: null, from: null, cap: null, shield: 0, notes };
  }
  const cap = capFor(sheet.source);
  const from = deflectSource(sheet.source);
  const named = from === 'worn' ? namedArmour(sheet.source, armour) : undefined;
  const parts = named ? wornParts(sheet, named) : null;
  const shield = parts ? parts.shieldBase + parts.shieldRung : shieldFor(sheet.source);
  if (parts && parts.shieldRung > 0) notes.push(`${RUNGS[parts.shieldRung]} ${parts.shieldName}`);
  const dexMod = modifier(sheet.dex);
  const dexPart = cap === null ? dexMod : Math.min(dexMod, cap);
  const dodge = dexPart + shield;
  const deflect = sheet.ac - BASE - dodge;
  if (deflect < 0) notes.push('Deflect below zero');
  if (cap !== null && dexMod > cap) notes.push(`Dexterity capped at ${cap}`);
  if (dexPart < 0) notes.push('negative Dexterity');
  return { dodge, deflect, from, cap, shield, notes };
}

/**
 * One tag's AC and scores, with its split.
 *
 * @param {string} path - Repo-relative path
 * @param {number} index - The tag's position among its kind in the file
 * @param {string} props - The tag's attribute text
 * @param {Array<object>} armour - Armour rows
 * @returns {object} The tag as a row
 */
export function readTag(path, index, props, armour = []) {
  const ac = props.match(/\b(?:armorClass|defence)="([^"]*)"/)?.[1];
  const dex = props.match(/\bdex="(\d+)"/)?.[1];
  const int = props.match(/\bint="(\d+)"/)?.[1];
  const type = props.match(/\btype="([^"]*)"/)?.[1];
  const lethality = props.match(/\blethality="(\d+)"/)?.[1];
  const parsed = ac === undefined ? { ac: null, source: '', multi: false } : parseArmorClass(ac);
  const sheet = {
    path,
    tag: index,
    name: basename(path).replace(/\.sheet\.mdx$/, ''),
    raw: ac ?? '',
    ac: parsed.ac,
    dex: dex === undefined ? null : Number(dex),
    int: int === undefined ? null : Number(int),
    type: type ?? null,
    lethality: lethality === undefined ? null : Number(lethality),
    source: parsed.source,
    multi: parsed.multi,
  };
  return { ...sheet, ...derive(sheet, armour) };
}

/**
 * Every Monster tag in a sheet, with its AC and Dexterity.
 *
 * @param {string} path - Repo-relative path
 * @param {string} source - File contents
 * @returns {Array<object>} One entry per tag
 */
export function sheetsIn(path, source, armour = []) {
  const out = [];
  let index = 0;
  for (const tag of source.matchAll(/<Monster\b([\s\S]*?)>/g)) {
    index += 1;
    out.push(readTag(path, index, tag[1], armour));
  }
  return out;
}

/**
 * The parts of an AC as written, each number with its label.
 *
 * @param {string} raw - The slot value
 * @returns {Array<{value: number, label: string}>} Parts in written order
 */
export function acParts(raw) {
  const parts = [];
  for (const match of raw.replaceAll('**', '').matchAll(/(\d+)(?:\s*\(([^)]*)\))?/g)) {
    parts.push({ value: Number(match[1]), label: (match[2] ?? '').trim() });
  }
  return parts;
}

/**
 * The three attributes a tag takes in place of its AC.
 *
 * @description Defence keeps the AC as written; Dodge is shared across
 * stances and Deflect carries each stance's label
 * @param {object} row - A settled row with raw, dodge and deflect
 * @returns {{defence: string, deflect: string, dodge: string}} Attribute values
 */
export function defenceAttributes(row) {
  if (row.dodge === null || row.deflect === null) {
    return { defence: row.raw, deflect: '—', dodge: '—' };
  }
  const parts = acParts(row.raw);
  const deflect =
    parts.length > 1
      ? parts
          .map((part) => `${part.value - BASE - row.dodge}${part.label ? ` (${part.label})` : ''}`)
          .join(', ')
      : String(row.deflect);
  return { defence: row.raw, deflect, dodge: String(row.dodge) };
}

/**
 * Writes the three Defence attributes over every AC slot in a file.
 *
 * @description Monster tags take the settled rows in file order; a Statlet
 * is split from its own attributes on the spot
 * @param {string} path - Repo-relative path
 * @param {string} source - File contents
 * @param {Array<object>} settled - Settled Monster rows for the file, in tag order
 * @param {Array<object>} armour - Armour rows
 * @returns {string} The rewritten file
 */
export function applyDefence(path, source, settled, armour = []) {
  let monsters = 0;
  return source.replace(/<(Monster|Statlet)\b([\s\S]*?)>/g, (tag, name, props) => {
    let row;
    if (name === 'Monster') {
      monsters += 1;
      row = settled[monsters - 1] ?? readTag(path, monsters, props, armour);
    } else {
      row = readTag(path, 0, props, armour);
    }
    if (!/\barmorClass="/.test(props)) return tag;
    const values = defenceAttributes(row);
    const next = props.replace(/(\s*)armorClass="[^"]*"/, (slot, lead) => {
      const sep = lead.includes('\n') ? lead : ' ';
      return `${lead}defence="${values.defence}"${sep}deflect="${values.deflect}"${sep}dodge="${values.dodge}"`;
    });
    return `<${name}${next}>`;
  });
}

/**
 * Reads the swarm's verdict files into a map keyed by sheet path and tag.
 *
 * @param {(string|undefined)} dir - Directory of verdict JSON files
 * @returns {Promise<Map<string, {wornArmour: string, evidence: string}>>}
 * Verdicts by `path:tag`
 */
export async function loadVerdicts(dir) {
  const verdicts = new Map();
  if (!dir) return verdicts;
  for await (const entry of glob('*.json', { cwd: resolve(ROOT, dir) })) {
    const raw = await readFile(resolve(ROOT, dir, entry), 'utf8');
    if (raw.trim() === '') continue;
    const file = JSON.parse(raw);
    const sheet = String(file.sheet ?? '').replaceAll('\\', '/');
    for (const tag of file.tags ?? []) {
      verdicts.set(`${sheet}:${tag.tag}`, {
        wornArmour: String(tag.wornArmour ?? '').toUpperCase(),
        evidence: tag.evidence ?? '',
      });
    }
  }
  return verdicts;
}

/**
 * Applies the swarm's answer to a row's Deflect source.
 *
 * @description Y makes the Deflect worn, N makes it natural; a slot that names
 * worn armour against an N is noted, since one of the two is wrong
 * @param {object} row - A derived row
 * @param {(object|undefined)} verdict - The swarm's answer for it
 * @returns {object} The row with its source settled and any added note
 */
export function annotate(row, verdict) {
  if (!verdict || row.from === null) return { ...row, worn: null };
  const notes = [...row.notes];
  const fromSlot = row.from;
  const from = verdict.wornArmour === 'Y' ? 'worn' : 'natural';
  if (fromSlot === 'worn' && from === 'natural') {
    notes.push('slot names armour, swarm says none');
  }
  if (fromSlot === 'natural' && from === 'worn' && row.source === '') {
    notes.push('worn per swarm, nothing on the slot');
  }
  return { ...row, from, worn: verdict.wornArmour, evidence: verdict.evidence, notes };
}

/**
 * Sweeps the sheets and writes the split.
 *
 * @returns {Promise<void>} Resolves once both files are written
 */
export async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const at = args.indexOf(name);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const verdicts = await loadVerdicts(flag('--verdicts'));
  const choicesFile = flag('--choices');
  const choices = choicesFile
    ? readChoices(await readFile(resolve(ROOT, choicesFile), 'utf8'))
    : new Map();
  const armour = armourRows(await readFile(resolve(ROOT, ARMOUR_PAGE), 'utf8'));
  const p = Number(flag('--percentile') ?? 75);
  const settledRows = [];
  for await (const entry of glob(PATTERNS, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    for (const row of sheetsIn(path, source, armour)) {
      settledRows.push(annotate(row, verdicts.get(`${path}:${row.tag}`)));
    }
  }
  const caps = tierCaps(settledRows, armour, p);
  const rows = [];
  for (const settled of settledRows) {
    const tier = tierOf(settled.lethality);
    const cap = tierCap(tier, caps);
    const key = `${settled.name}${settled.tag > 1 ? ` (${settled.tag})` : ''}`;
    const chosen = choices.get(key);
    const shieldChosen = chosen?.shield && settled.shield === 0 ? chosen.shield : 0;
    const fit =
      settled.from === 'natural' && settled.ac !== null && settled.dex !== null
        ? fits(settled.ac - shieldChosen, modifier(settled.dex), armour, cap)
        : {
            closest: [],
            unwasted: [],
            reading: settled.from === 'worn' ? wornReading(settled, armour) : [],
            overCap: false,
          };
    const notes = fit.overCap
      ? [...settled.notes, `above ${RUNGS[cap] || 'Mundane'} for tier ${tier ?? '?'}`]
      : settled.notes;
    let row = { ...settled, fits: fit, notes };
    if (chosen?.armour === 'natural armour') {
      row = { ...row, fits: { ...fit, reading: [] }, notes: [...row.notes, 'chosen: natural'] };
    } else if (chosen?.armour) {
      row = {
        ...row,
        from: 'worn',
        fits: { ...fit, reading: [chosen.armour] },
        notes: [...row.notes, 'chosen'],
      };
    }
      if (chosen?.shield && row.shield === 0 && row.dodge !== null) {
      row = {
        ...row,
        shield: chosen.shield,
        dodge: row.dodge + chosen.shield,
        deflect: row.deflect - chosen.shield,
        notes: [...row.notes, `chosen: shield +${chosen.shield}`],
      };
    }
    if ((chosen?.fixed || fixedBySlot(row.source)) && row.dodge !== null) {
      row = {
        ...row,
        dodge: 0,
        deflect: 0,
        from: 'fixed',
        fits: { ...row.fits, reading: [] },
        notes: [...row.notes.filter((note) => note !== 'Deflect below zero'), 'Defence fixed at 10 by trait'],
      };
    }
    rows.push(row);
  }

  if (args.includes('--apply')) {
    const dryRun = args.includes('--dry-run');
    const byPath = new Map();
    for (const row of rows) {
      if (!byPath.has(row.path)) byPath.set(row.path, []);
      byPath.get(row.path).push(row);
    }
    let written = 0;
    for await (const entry of glob(APPLY_PATTERNS, { cwd: ROOT })) {
      const path = entry.replaceAll('\\', '/');
      const source = await readFile(resolve(ROOT, entry), 'utf8');
      if (!/\barmorClass="/.test(source)) continue;
      const next = applyDefence(path, source, byPath.get(path) ?? [], armour);
      if (next === source) continue;
      written += 1;
      console.log(`  ${path}`);
      if (!dryRun) await writeFile(resolve(ROOT, entry), next, 'utf8');
    }
    console.log(`${dryRun ? 'Would rewrite' : 'Rewrote'} ${written} files' AC slots into defence, deflect and dodge`);
  }

  const capTable = [
    `| Tier | Sheets | p50 | p75 | p90 | Allowance at p${p} |`,
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...caps.map(
      (entry) =>
        `| ${entry.label} | ${entry.n} | ${entry.p50 ?? '—'} | ${entry.p75 ?? '—'} | ${entry.p90 ?? '—'} | ${RUNGS[entry.cap] || 'Mundane'} (${entry.cap >= 0 ? '+' : ''}${entry.cap}) |`,
    ),
  ];
  console.log(capTable.join('\n'));

  const underOut = flag('--under-band');
  if (underOut) {
    await writeFile(resolve(ROOT, underOut), underBandTable(rows), 'utf8');
    console.log(`under-band table → ${underOut}`);
  }

  const listOut = flag('--choices-out');
  if (listOut) {
    await writeFile(resolve(ROOT, listOut), choiceList(rows, armour, caps), 'utf8');
    console.log(
      `${rows.filter((row) => row.from === 'natural' && row.ac !== null && row.dex !== null && couldWearArmour(row)).length} creatures listed → ${listOut}`,
    );
  }

  const clean = rows.filter((row) => row.notes.length === 0);
  const flagged = rows.filter((row) => row.notes.length > 0);
  const shielded = rows.filter((row) => row.shield > 0);
  const capped = rows.filter((row) => row.cap !== null);

  const worn = rows.filter((row) => row.from === 'worn');
  const line = (row) =>
    `| ${row.name}${row.tag > 1 ? ` (${row.tag})` : ''} | ${row.raw.replaceAll('|', '\\|')} | ${row.dex ?? '—'} | ${row.dodge ?? '—'} | ${row.deflect ?? '—'} | ${row.from ?? '—'} | ${row.fits.reading.join(', ')} | ${row.notes.join('; ')} |`;
  const head = [
    '| Sheet | AC as written | Dex | Dodge | Deflect | Deflect from | Reads as | Notes |',
    '| --- | --- | ---: | ---: | ---: | --- | --- | --- |',
  ];

  const text = [
    '# Monster defence split',
    '',
    `${rows.length} Monster tags. Defence is 10 + Deflect + Dodge. Dodge is the Dexterity modifier, capped by the armour the sheet names (heavy 0, medium 2), plus a named shield (greatshield 3, shield 2, buckler 1). Deflect is what the declared AC leaves above 10 after Dodge: worn armour when the creature wears protection that is not its own body, natural armour otherwise. There is no bare creature; what deflects by nature is natural armour, and a creature with nothing to deflect has Deflect 0. The worn or natural call comes from the swarm's reading of the sheet when a verdicts directory is given, and from the AC parenthetical alone otherwise. Reads as reads a natural row's declared AC as an armour row plus a quality rung (one point of AC per rung, Ruined −4 to True +5). Higher bands wear higher quality, so the rung a tier may reach is read off the corpus: for every natural-armour creature the rung of its nearest-Mundane fit is taken, and each tier group's allowance is a percentile of those (75th unless \`--percentile\` says otherwise), so a low band with wide variance does not hand everyone an Enhanced gambeson. Within that, the rows nearest Mundane win, except at a Dexterity of +4 or more, where the rows wasting the least of it win. A reading above its tier is noted. Monster sheets never wrote worn armour down, so this is the inference an author would make; the row file keeps the uncapped readings too.`,
    '',
    ...capTable,
    '',
    `Clean ${clean.length}, flagged ${flagged.length}, Dexterity capped by armour ${capped.length}, shield on the slot ${shielded.length}, Deflect from worn armour ${worn.length}, from natural armour ${rows.length - worn.length}, swarm answers ${rows.filter((row) => row.worn).length}.`,
    '',
    '## Flagged',
    '',
    ...head,
    ...flagged.map(line),
    '',
    '## Clean',
    '',
    ...head,
    ...clean.map(line),
    '',
  ].join('\n');

  await mkdir(resolve(ROOT, '.ignore/reports'), { recursive: true });
  await writeFile(REPORT, text, 'utf8');
  await writeFile(ROWS, JSON.stringify(rows, null, 2), 'utf8');
  console.log(
    `${rows.length} tags: clean ${clean.length}, flagged ${flagged.length}, capped ${capped.length}, shielded ${shielded.length}, worn ${worn.length}, natural ${rows.length - worn.length} → ${relative(ROOT, REPORT)}`,
  );
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
