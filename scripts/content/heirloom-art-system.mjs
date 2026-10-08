/**
 * @fileoverview Reads the weapon rules pages and contrasts heirloom props against them.
 */

import { readFileSync } from 'node:fs';

/** Page defining chassis, finishes, steppers and the twelve arts. */
const ARTS_PAGE = 'src/content/en/rules/arms-armour-and-burden/weapon-arts.rule.mdx';

/** Catalogue mapping each pattern to a base, attributes, masteries and blow. */
const CATALOGUE_PAGE = 'src/content/en/items/equipment/weapons.rule.mdx';

/** Repertoire of legal attribute names. */
const PROPERTIES_PAGE = 'src/content/en/rules/arms-armour-and-burden/weapon-properties.rule.mdx';

/** Irregular plurals used by the chassis pattern column. */
const IRREGULAR_PLURALS = new Map([['staves', 'staff']]);

/** Leading words that mark a pattern as a placeholder rather than a catalogue name. */
const ABSTRACT_PATTERN = /^(any|all|chosen|varies|none|various|see)\b/i;

/** Separator row of a markdown table. */
const TABLE_SEPARATOR = /^:?-{2,}:?$/;

/**
 * Splits markdown into level-two sections.
 *
 * @param {string} markdown - Source markdown.
 * @returns {Array<{ heading: string, body: string }>} Sections in document order.
 */
function splitSections(markdown) {
  const sections = [];
  let heading = '';
  let body = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.*)$/);
    if (match) {
      sections.push({ heading, body: body.join('\n') });
      heading = match[1].trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  sections.push({ heading, body: body.join('\n') });
  return sections;
}

/**
 * Reads every markdown table row from a body of text.
 *
 * @param {string} body - Section body.
 * @returns {string[][]} Rows of cells including the header, separators removed.
 */
function tableRows(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))
    .map((line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => TABLE_SEPARATOR.test(cell)));
}

/**
 * Splits a comma separated cell into trimmed items, ignoring commas inside parentheses.
 *
 * @param {string} value - Cell value.
 * @returns {string[]} Items, empty markers dropped.
 */
function splitList(value) {
  const shielded = value.replace(/\(([^)]*)\)/g, (group) => group.replace(/,/g, '\u0000'));
  return shielded
    .split(',')
    .map((item) => item.replace(/\u0000/g, ',').trim())
    .filter((item) => item.length > 0 && item !== '—' && item !== '-');
}

/**
 * Lower-cases a name and collapses whitespace.
 *
 * @param {string} value - Raw name.
 * @returns {string} Comparable name.
 */
function norm(value) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Strips a regular trailing plural, or maps an irregular one.
 *
 * @param {string} name - Comparable name.
 * @returns {string} Singular form.
 */
function singular(name) {
  if (IRREGULAR_PLURALS.has(name)) return IRREGULAR_PLURALS.get(name);
  return name.endsWith('s') && !name.endsWith('ss') ? name.slice(0, -1) : name;
}

/**
 * Levenshtein distance between two words.
 *
 * @param {string} a - First word.
 * @param {string} b - Second word.
 * @returns {number} Edit count.
 */
function distance(a, b) {
  const grid = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) grid[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      grid[i][j] = Math.min(
        grid[i - 1][j] + 1,
        grid[i][j - 1] + 1,
        grid[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return grid[a.length][b.length];
}

/**
 * Finds the closest known pattern, by containment first and edit distance second.
 *
 * @param {string} word - Comparable pattern name.
 * @param {Iterable<string>} names - Comparable candidates.
 * @returns {string | null} Closest candidate, or null when nothing is near.
 */
function closest(word, names) {
  const inner = [...names].filter((name) => name.length >= 3 && word.includes(name));
  if (inner.length > 0) return inner.sort((a, b) => b.length - a.length)[0];
  let best = null;
  let score = Infinity;
  for (const name of names) {
    const next = distance(word, name);
    if (next < score) {
      score = next;
      best = name;
    }
  }
  return score <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

/**
 * Builds the art table: art name to chassis, finish, masteries, blow and attributes.
 *
 * @param {string} markdown - Weapon arts page.
 * @returns {Map<string, object>} Art name to record.
 */
function parseArts(markdown) {
  const section = splitSections(markdown).find((entry) => entry.heading === 'The Twelve Arts');
  const arts = new Map();
  if (!section) return arts;
  for (const cells of tableRows(section.body)) {
    if (cells[0] === 'Art' || cells.length < 7) continue;
    const [art, chassis, finish, first, second, blow] = cells;
    arts.set(norm(art), {
      name: art,
      chassis: splitList(chassis),
      finish: splitList(finish),
      masteries: [first, second],
      blow,
    });
  }
  return arts;
}

/**
 * Builds the pattern catalogue: pattern name to its catalogue row.
 *
 * @param {string} markdown - Weapon catalogue page.
 * @returns {Map<string, object>} Pattern name to record.
 */
function parseCatalogue(markdown) {
  const catalogue = new Map();
  for (const section of splitSections(markdown)) {
    for (const cells of tableRows(section.body)) {
      if (cells[0] === 'Pattern' || cells.length < 9) continue;
      const [pattern, proficiency, dice, attributes, , masteries, blow, base] = cells;
      catalogue.set(norm(pattern), {
        name: pattern,
        group: section.heading,
        proficiency,
        dice,
        attributes: splitList(attributes),
        masteries: splitList(masteries),
        blow,
        base,
      });
    }
  }
  return catalogue;
}

/**
 * Maps every term in the chassis pattern column to its chassis.
 *
 * @param {string} markdown - Weapon arts page.
 * @returns {Map<string, string>} Term to chassis name.
 */
function parseChassisPatterns(markdown) {
  const section = splitSections(markdown).find((entry) => entry.heading === 'Chassis');
  const terms = new Map();
  if (!section) return terms;
  for (const cells of tableRows(section.body)) {
    if (cells[0] === 'Chassis' || cells.length < 5) continue;
    for (const term of splitList(cells[2])) terms.set(singular(norm(term)), cells[0]);
  }
  return terms;
}

/**
 * Collects the legal attribute names from the properties repertoire.
 *
 * @param {string} markdown - Weapon properties page.
 * @returns {Set<string>} Comparable attribute names.
 */
function parseVocabulary(markdown) {
  const section = splitSections(markdown).find((entry) => entry.heading === 'Attributes');
  const vocabulary = new Set();
  if (!section) return vocabulary;
  for (const cells of tableRows(section.body)) {
    if (cells[0] === 'Attribute' || cells.length < 4) continue;
    vocabulary.add(norm(cells[0].replace(/\s*\(N\)$/, '')));
  }
  return vocabulary;
}

/**
 * Reads the props of the Heirloom component.
 *
 * @param {string} text - File contents.
 * @returns {Record<string, string> | null} Prop values, or null when absent.
 */
export function parseProps(text) {
  const block = text.match(/<Heirloom\b([\s\S]*?)(?:\/>|>)\s*\r?\n/);
  if (!block) return null;
  const props = {};
  for (const pair of block[1].matchAll(/([A-Za-z][\w-]*)\s*=\s*"([^"]*)"/g)) props[pair[1]] = pair[2];
  return props;
}

/**
 * Splits a base value into its three parts.
 *
 * @param {string} value - Base prop value.
 * @returns {{ parts: string[], stray: boolean }} Parts and whether a stray join was used.
 */
function parseBase(value) {
  const stray = /[+?]/.test(value) || /\bor\b/i.test(value);
  return { parts: splitList(value.replace(/\bor\b/gi, ',').replace(/\+/g, ',')), stray };
}

/**
 * Resolves a pattern name against the catalogue, then the chassis terms.
 *
 * @param {string} name - Comparable pattern name.
 * @param {Map<string, object>} catalogue - Pattern catalogue.
 * @param {Map<string, string>} chassisPatterns - Chassis term map.
 * @returns {{ source: string, row: object | null, chassis: string | null } | null} Resolution.
 */
function resolvePattern(name, catalogue, chassisPatterns) {
  if (catalogue.has(name)) return { source: 'catalogue', row: catalogue.get(name), chassis: null };
  const single = singular(name);
  if (catalogue.has(single)) return { source: 'catalogue', row: catalogue.get(single), chassis: null };
  if (chassisPatterns.has(single)) return { source: 'chassis', row: null, chassis: chassisPatterns.get(single) };
  return null;
}

/**
 * Builds a report entry.
 *
 * @param {'error'|'warning'|'info'} severity - Severity.
 * @param {string} code - Machine-readable code.
 * @param {string} detail - Human-readable detail.
 * @returns {object} Entry.
 */
function entry(severity, code, detail) {
  return { severity, code, detail };
}

/**
 * Compares one heirloom's pattern against the catalogue.
 *
 * @param {Record<string, string>} props - Heirloom props.
 * @param {object} system - Loaded art system.
 * @returns {object[]} Issues found.
 */
function contrastPattern(props, system) {
  const issues = [];
  if (ABSTRACT_PATTERN.test(props.pattern)) {
    issues.push(entry('info', 'pattern-abstract', `pattern "${props.pattern}" names no single entry`));
    return issues;
  }
  const resolution = resolvePattern(norm(props.pattern), system.catalogue, system.chassisPatterns);
  if (!resolution) {
    const names = [...system.catalogue.keys(), ...system.chassisPatterns.keys()];
    const near = closest(norm(props.pattern), names);
    const hint = near ? ` (nearest: ${near})` : '';
    const detail = `pattern "${props.pattern}" is not in the catalogue${hint}`;
    issues.push(entry('error', 'pattern-unresolved', detail));
    return issues;
  }
  if (resolution.source === 'chassis') {
    const detail = `pattern "${props.pattern}" is a chassis term, not a catalogue row`;
    issues.push(entry('info', 'pattern-category', detail));
  } else if (props.base && norm(resolution.row.base) !== norm(props.base)) {
    const detail = `base "${props.base}" differs from catalogue row "${resolution.row.base}"`;
    issues.push(entry('warning', 'base-drift', detail));
  }
  return issues;
}

/**
 * Compares one heirloom's base and masteries against the art table.
 *
 * @param {Record<string, string>} props - Heirloom props.
 * @param {object} system - Loaded art system.
 * @returns {object[]} Issues found.
 */
function contrastBase(props, system) {
  const issues = [];
  const base = parseBase(props.base);
  if (base.stray) issues.push(entry('warning', 'base-separator', `base "${props.base}" uses a stray join`));
  if (base.parts.length !== 3) {
    issues.push(entry('error', 'base-shape', `base "${props.base}" is not chassis, finish, art`));
    return issues;
  }
  const [chassis, finish, art] = base.parts;
  if (![chassis, finish, art].every((part) => /\p{L}/u.test(part))) {
    issues.push(entry('error', 'base-placeholder', `base "${props.base}" carries a placeholder part`));
  }
  const artEntry = system.arts.get(norm(art));
  if (!artEntry) {
    issues.push(entry('error', 'art-unknown', `art "${art}" is not one of the twelve`));
    return issues;
  }
  const matches = (values, value) => values.some((entryValue) => norm(entryValue) === norm(value));
  if (!matches(artEntry.chassis, chassis)) {
    issues.push(entry('error', 'chassis-off-art', `chassis "${chassis}" is not on ${artEntry.name}`));
  }
  if (!matches(artEntry.finish, finish)) {
    const detail = `finish "${finish}" is not ${artEntry.finish.join(' or ')} on ${artEntry.name}`;
    issues.push(entry('error', 'finish-off-art', detail));
  }
  if (props.mastery && !matches(artEntry.masteries, props.mastery)) {
    issues.push(entry('info', 'mastery-custom', `mastery "${props.mastery}" is outside ${artEntry.name}`));
  }
  if (props.masterfulBlow && norm(props.masterfulBlow) !== norm(artEntry.blow)) {
    const detail = `blow "${props.masterfulBlow}" replaces ${artEntry.blow} of ${artEntry.name}`;
    issues.push(entry('info', 'blow-custom', detail));
  }
  return issues;
}

/**
 * Compares one heirloom's attributes against the repertoire.
 *
 * @param {Record<string, string>} props - Heirloom props.
 * @param {object} system - Loaded art system.
 * @returns {object[]} Issues found.
 */
function contrastAttributes(props, system) {
  const issues = [];
  for (const attribute of splitList(props.attributes ?? '')) {
    const bare = norm(attribute.replace(/\s*\(.*\)$/, ''));
    if (system.vocabulary.has(bare)) continue;
    const detail = `attribute "${attribute}" is not in the repertoire`;
    issues.push(entry('warning', 'attribute-unknown', detail));
  }
  return issues;
}

/**
 * Compares one heirloom's props against the art and chassis system.
 *
 * @param {Record<string, string>} props - Heirloom props.
 * @param {object} system - Loaded art system.
 * @returns {object[]} Issues found.
 */
export function contrast(props, system) {
  const issues = contrastPattern(props, system);
  if (!props.base) {
    issues.push(entry('error', 'base-missing', 'no base prop'));
    return issues;
  }
  return issues.concat(contrastBase(props, system), contrastAttributes(props, system));
}

/**
 * Reads the rules pages and builds the art system lookups.
 *
 * @returns {{ arts: Map<string, object>, catalogue: Map<string, object>, chassisPatterns: Map<string, string>, vocabulary: Set<string> }} Lookups.
 */
export function loadArtSystem() {
  const artsMarkdown = readFileSync(ARTS_PAGE, 'utf8');
  return {
    arts: parseArts(artsMarkdown),
    catalogue: parseCatalogue(readFileSync(CATALOGUE_PAGE, 'utf8')),
    chassisPatterns: parseChassisPatterns(artsMarkdown),
    vocabulary: parseVocabulary(readFileSync(PROPERTIES_PAGE, 'utf8')),
  };
}
