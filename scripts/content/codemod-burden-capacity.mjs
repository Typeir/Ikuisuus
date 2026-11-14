/**
 * @fileoverview Converts carrying capacity to burdens and deletes Tremendous Strength, per the ruling of 11 Nov 2026.
 * @description Dry run by default. Pass `--apply` to write, `--out <file>` to save the report.
 * Heavy Load gains 6 burdens per point of Strength up to 20, 12 per point to 30, 18 to 40, and so on.
 * Light is a third of Heavy and Medium two thirds, so every value is a whole burden.
 * The load penalty table takes David's values, and the prose it superseded is deleted.
 */

import { pathToFileURL } from 'node:url';
import { emit, eolOf, mapLines, parseFlags, readText, splitKeepingEol } from './codemod-io.mjs';

/** Rules page holding the table and the deleted section. */
export const RULE_FILE =
  'src/content/en/rules/arms-armour-and-burden/encumbrance-and-carrying-capacity.rule.mdx';

/** Builder table of thresholds by Strength. */
export const CONSTANTS_FILE = 'src/modules/character-builder/domain/carrying-capacity/constants.ts';

/** Builder threshold calculation. */
export const COMPUTE_FILE = 'src/modules/character-builder/infrastructure/carrying-capacity.ts';

/** Unit test of the threshold calculation. */
export const COMPUTE_TEST = 'tests/unit/src/modules/character-builder/infrastructure/carrying-capacity.test.ts';

/** Re-export tests that pin the STR 10 row. */
export const REEXPORT_TESTS = [
  'tests/unit/src/lib/data/carryingCapacity.test.ts',
  'tests/unit/src/modules/character-builder/domain/carrying-capacity/constants.test.ts',
];

/** Builder UI strings that name the weight unit. */
export const MESSAGES_FILE = 'messages/en/characterSheet.json';

/**
 * Exact UI label rewrites, each with the number of times it must match.
 *
 * @type {ReadonlyArray<{ from: string, to: string, count: number }>}
 */
export const LABELS = [
  { from: '"Weight (lb)"', to: '"Weight (burden)"', count: 1 },
  { from: '"Carried (lb)"', to: '"Carried (burden)"', count: 1 },
  { from: '"Carried weight in pounds"', to: '"Carried weight in burdens"', count: 1 },
  { from: '≤ {weight} lb"', to: '≤ {weight} burden"', count: 3 },
];

/**
 * Builder files whose JSDoc names pounds, with the number of JSDoc lines that must change.
 *
 * @type {ReadonlyArray<{ path: string, lines: number }>}
 */
export const JSDOC_FILES = [
  { path: 'src/modules/character-builder/domain/character/characterEntity.ts', lines: 2 },
  { path: 'src/modules/character-builder/application/builderCore/builderMetrics.ts', lines: 7 },
  { path: 'src/modules/character-builder/application/builderCore/types.ts', lines: 1 },
  { path: 'src/modules/character-builder/domain/carrying-capacity/types.ts', lines: 2 },
  { path: 'src/modules/character-builder/presentation/tabs/equipmentTab.tsx', lines: 1 },
];

/** Heavy Load gained per point of Strength up to FLAT_UNTIL. */
export const STEP = 6;

/** Last Strength at the base step. */
export const FLAT_UNTIL = 20;

/** Points of Strength per band past FLAT_UNTIL; each band adds STEP to the per-point gain. */
export const BAND = 10;

/** Last Strength row the extended table lists. */
export const MAX_STRENGTH = 80;

/**
 * Rule text written by David on 11 Nov 2026, set as a list; it replaces the table's intro paragraph verbatim.
 *
 * @type {ReadonlyArray<string>}
 */
export const AUTHORED_INTRO = [
  'Your carrying capacity is determined by your Strength Score, as described by the following formula:',
  '',
  'Heavy carrying capacity is the sum of the following, per point in your Strength Score:',
  '',
  '- Strength 1–20: +6 Heavy per point.',
  '- Strength 21–30: +12 per point.',
  '- Strength 31–40: +18 per point.',
  '- Each band of 10 after that adds 6 more per point, for example, +42 per point for Strength 71–80.',
  '',
  'Light load is a third of Heavy, and Medium load is two thirds.',
  '',
  'Sizes above medium double carrying capacity per size, and creatures with a markedly load-bearing, or many-limbed frame increase it by 1.5 times.',
  '',
  '_Medium Biped Calculations:_',
];

/**
 * Quadruped text edits: ×1.5 applies at every size, and the frame takes David's phrase of 11 Nov 2026.
 * An empty `to` deletes the line.
 *
 * @type {ReadonlyArray<{ from: string, to: string }>}
 */
export const QUADRUPED_DELETIONS = [
  { from: ' with the quadruped value at Medium and larger sizes:', to: ' with the quadruped value:' },
  { from: 'with a markedly load-bearing frame)', to: 'with a markedly load-bearing, or many-limbed frame)' },
  {
    from: 'Sizes smaller than Medium continue to use the bipedal size multipliers from the previous table.',
    to: '',
  },
];

/**
 * Renders a markdown table with every column padded to its widest cell.
 *
 * @param {string[][]} cells - Header row first, then body rows.
 * @returns {string[]} Header, separator and body lines.
 */
function padTable(cells) {
  const widths = cells[0].map((_, column) => Math.max(...cells.map((row) => row[column].length)));
  const line = (row) => `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`;
  return [line(cells[0]), line(widths.map((width) => '-'.repeat(width))), ...cells.slice(1).map(line)];
}

/**
 * Load penalty table written by David on 11 Nov 2026; strides use the unit expression.
 *
 * @type {ReadonlyArray<string>}
 */
export const AUTHORED_PENALTIES = padTable([
  ['Load', 'Penalty'],
  ['Light', 'none'],
  ['Medium', '−[= 1 stride =] to Speed'],
  ['Heavy', 'Speed and Dodge halved, Disadvantage on DEX rolls'],
  ['Over', 'Max Speed is [= 1 stride =], Dodge is set to zero, Disadvantage on all rolls'],
]);

/**
 * Starts of the prose lines under the old penalty table, deleted with it.
 *
 * @type {ReadonlyArray<string>}
 */
export const PENALTY_PROSE = [
  'A medium load costs a third of your speed',
  '**Check Penalty** applies',
  '**Max DEX** caps',
];

/** Heading of the penalty section. */
const PENALTY_HEADING = '## Load Penalties';

/** Heading of the table section. */
const TABLE_HEADING = '## Carrying Capacity by Strength';

/** Heading of the deleted section. */
const DELETED_HEADING = '## Tremendous Strength';

/**
 * Finds the table's row span on the page.
 *
 * @param {string[]} lines - Page lines.
 * @returns {{ start: number, end: number }} First row and the index past the last row.
 */
export function readTable(lines) {
  const heading = lines.indexOf(TABLE_HEADING);
  if (heading < 0) {
    throw new Error(`missing heading: ${TABLE_HEADING}`);
  }
  const header = lines.findIndex((line, index) => index > heading && /^\|\s*Strength\s*\|/.test(line));
  const start = header + 2;
  let end = start;
  while (end < lines.length && lines[end].startsWith('|')) {
    end += 1;
  }
  return { start, end };
}

/**
 * Heavy Load gained by the point of Strength that reaches the given score.
 *
 * @param {number} strength - Strength score, 1 or more.
 * @returns {number} STEP up to FLAT_UNTIL, then one more STEP for each band of BAND points past it.
 */
export function stepAt(strength) {
  if (strength <= FLAT_UNTIL) {
    return STEP;
  }
  return STEP * (1 + Math.ceil((strength - FLAT_UNTIL) / BAND));
}

/**
 * Heavy Load at a Strength score, the sum of every step up to it.
 *
 * @param {number} strength - Strength score.
 * @returns {number} Heavy Load in burdens.
 */
export function heavyAt(strength) {
  let heavy = 0;
  for (let score = 1; score <= strength; score += 1) {
    heavy += stepAt(score);
  }
  return heavy;
}

/**
 * Builds the full burden table; Light is a third of Heavy and Medium two thirds.
 *
 * @param {number} max - Last Strength row.
 * @returns {Array<{ strength: number, light: number, medium: number, heavy: number }>} Rows in Strength order.
 */
export function burdenTable(max) {
  return Array.from({ length: max }, (_, index) => {
    const heavy = heavyAt(index + 1);
    return { strength: index + 1, light: heavy / 3, medium: (heavy * 2) / 3, heavy };
  });
}

/**
 * Renders table rows padded to the header's column widths.
 *
 * @param {string} header - Header line of the table.
 * @param {ReturnType<typeof burdenTable>} rows - Burden rows.
 * @returns {string[]} Markdown rows.
 */
export function renderRows(header, rows) {
  const widths = header.split('|').slice(1, -1).map((cell) => cell.length - 2);
  const format = (value) => value.toLocaleString('en-US');
  return rows.map((row) => {
    const cells = [String(row.strength), format(row.light), format(row.medium), format(row.heavy)];
    return `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`;
  });
}

/**
 * Swaps the old penalty table for David's and deletes the prose it superseded, in place.
 *
 * @param {string[]} lines - Page lines.
 * @returns {string[]} Deleted lines.
 */
export function rewritePenalties(lines) {
  const heading = lines.indexOf(PENALTY_HEADING);
  if (heading < 0) {
    throw new Error(`missing heading: ${PENALTY_HEADING}`);
  }
  const start = lines.findIndex((line, index) => index > heading && /^\|\s*Load\s*\|/.test(line));
  if (start < 0) {
    throw new Error('penalty table not found');
  }
  let end = start;
  while (end < lines.length && lines[end].startsWith('|')) {
    end += 1;
  }
  const deleted = lines.splice(start, end - start, ...AUTHORED_PENALTIES);
  for (const prefix of PENALTY_PROSE) {
    const at = lines.findIndex((line, index) => index > heading && line.startsWith(prefix));
    if (at < 0) {
      throw new Error(`penalty prose not found: ${prefix}`);
    }
    deleted.push(...lines.splice(at, lines[at + 1] === '' ? 2 : 1));
  }
  return deleted;
}

/**
 * Rewrites the rules page.
 *
 * @param {string} text - Page text.
 * @returns {{ text: string, rows: ReturnType<typeof burdenTable>, deleted: string[] }} New text, the table and the deleted lines.
 */
export function rewritePage(text) {
  const eol = eolOf(text);
  const lines = splitKeepingEol(text).filter((_, index) => index % 2 === 0);
  const { start, end } = readTable(lines);
  const rows = burdenTable(MAX_STRENGTH);
  const intro = lines.findIndex((line) => line.includes('from 1 to 29'));
  if (intro < 0 || intro > start) {
    throw new Error('intro range "from 1 to 29" not found above the table');
  }
  lines.splice(start, end - start, ...renderRows(lines[start - 2], rows));
  lines.splice(intro, 1, ...AUTHORED_INTRO);
  const cut = lines.indexOf(DELETED_HEADING);
  if (cut < 0) {
    throw new Error(`missing heading: ${DELETED_HEADING}`);
  }
  let stop = cut + 1;
  while (stop < lines.length && !/^(#{1,2}\s|---\s*$)/.test(lines[stop])) {
    stop += 1;
  }
  const deleted = lines.splice(cut, stop - cut);
  deleted.push(...rewritePenalties(lines).filter(Boolean));
  for (const deletion of QUADRUPED_DELETIONS) {
    const at = lines.findIndex((line) => line.includes(deletion.from));
    if (at < 0) {
      throw new Error(`quadruped text not found: ${deletion.from}`);
    }
    deleted.push(deletion.to ? deletion.from.trim() : lines[at]);
    if (deletion.to) {
      lines[at] = lines[at].replace(deletion.from, deletion.to);
    } else {
      lines.splice(at, 1);
      if (lines[at - 1] === '' && lines[at] === '') {
        lines.splice(at, 1);
      }
    }
  }
  return { text: lines.join(eol), rows, deleted };
}

/**
 * Renders the builder's STR_TABLE block.
 *
 * @param {ReturnType<typeof burdenTable>} rows - Burden rows.
 * @returns {string} TypeScript source for the constant and its JSDoc.
 */
export function renderConstant(rows) {
  const body = rows.map((row) => `  ${row.strength}: { light: ${row.light}, medium: ${row.medium}, heavy: ${row.heavy} },`);
  return [
    '/**',
    ` * Carrying capacity in burdens for Strength Score 1-${MAX_STRENGTH}.`,
    ' *',
    ' * @constant STR_TABLE',
    ' */',
    'export const STR_TABLE: Record<number, CapacityThresholds> = {',
    ...body,
    '};',
  ].join('\n');
}

/**
 * Replaces one exact anchor in a text, failing when it is absent.
 *
 * @param {string} text - Source text.
 * @param {string | RegExp} anchor - Text or pattern to replace.
 * @param {string} replacement - New text.
 * @param {string} path - File path for the error.
 * @returns {string} Rewritten text.
 */
function replaceAnchor(text, anchor, replacement, path) {
  const found = typeof anchor === 'string' ? text.includes(anchor) : anchor.test(text);
  if (!found) {
    throw new Error(`${path}: anchor not found: ${String(anchor).slice(0, 80)}`);
  }
  return text.replace(anchor, () => replacement);
}

/**
 * Rewrites the builder's constants file.
 *
 * @param {string} text - constants.ts text.
 * @param {ReturnType<typeof burdenTable>} rows - Burden rows.
 * @returns {string} New text.
 */
export function rewriteConstants(text, rows) {
  const eol = eolOf(text);
  const block = /\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*export const STR_TABLE[\s\S]*?\n\};/;
  return replaceAnchor(text, block, renderConstant(rows).replace(/\n/g, eol), CONSTANTS_FILE);
}

/** Builder penalty constant matching AUTHORED_PENALTIES. */
export const PENALTY_CONSTANT = [
  '/**',
  ' * Speed, Dodge and roll penalties applied at each load tier.',
  ' *',
  ' * @constant LOAD_PENALTIES',
  ' */',
  'export const LOAD_PENALTIES = {',
  "  light: { speedLoss: 0, speedFactor: 1, maxSpeed: null, dodgeFactor: 1, disadvantage: 'none' },",
  "  medium: { speedLoss: 1, speedFactor: 1, maxSpeed: null, dodgeFactor: 1, disadvantage: 'none' },",
  "  heavy: { speedLoss: 0, speedFactor: 0.5, maxSpeed: null, dodgeFactor: 0.5, disadvantage: 'dex' },",
  "  over: { speedLoss: 0, speedFactor: 1, maxSpeed: 1, dodgeFactor: 0, disadvantage: 'all' },",
  '} as const;',
].join('\n');

/**
 * Replaces the builder's LOAD_PENALTIES block with the ruled penalties.
 *
 * @param {string} text - constants.ts text.
 * @returns {string} New text.
 */
export function rewriteLoadPenalties(text) {
  const eol = eolOf(text);
  const block = /\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*export const LOAD_PENALTIES = \{[\s\S]*?\r?\n\};/;
  return replaceAnchor(text, block, PENALTY_CONSTANT.replace(/\n/g, eol), CONSTANTS_FILE);
}

/**
 * Rewrites the builder's calculation: no ×4 per 10 points, scores past the table clamp to its last row.
 *
 * @param {string} text - carrying-capacity.ts text.
 * @returns {string} New text.
 */
export function rewriteCompute(text) {
  const eol = eolOf(text);
  const lf = text.replace(/\r\n/g, '\n');
  let next = replaceAnchor(
    lf,
    "} from '@/modules/character-builder/domain/carrying-capacity';\n",
    "} from '@/modules/character-builder/domain/carrying-capacity';\n\nconst TOP_STRENGTH = Math.max(...Object.keys(STR_TABLE).map(Number));\n\nconst QUADRUPED_FACTOR = 1.5;\n",
    COMPUTE_FILE,
  );
  next = replaceAnchor(next, '    QUADRUPED_MULTIPLIERS,\n', '', COMPUTE_FILE);
  next = replaceAnchor(
    next,
    '  const sizeMultiplier =\n    isQuadruped && QUADRUPED_MULTIPLIERS[size] !== undefined\n      ? (QUADRUPED_MULTIPLIERS[size] as number)\n      : SIZE_MULTIPLIERS[size];\n',
    '  const sizeMultiplier = SIZE_MULTIPLIERS[size] * (isQuadruped ? QUADRUPED_FACTOR : 1);\n',
    COMPUTE_FILE,
  );
  next = replaceAnchor(
    next,
    '  let baseStrength = strength;\n  let multiplier = 1;\n  while (baseStrength > 29) {\n    baseStrength -= 10;\n    multiplier *= 4;\n  }\n  const base = STR_TABLE[baseStrength] ?? STR_TABLE[10];\n',
    '  const base = STR_TABLE[Math.min(strength, TOP_STRENGTH)] ?? STR_TABLE[10];\n',
    COMPUTE_FILE,
  );
  next = replaceAnchor(next, '  const total = multiplier * sizeMultiplier;\n\n', '', COMPUTE_FILE);
  next = next.replace(/base\.(light|medium|heavy) \* total/g, 'base.$1 * sizeMultiplier');
  next = replaceAnchor(next, 'heavy thresholds in pounds', 'heavy thresholds in burdens', COMPUTE_FILE);
  return next.replace(/\n/g, eol);
}

/** Size multipliers the builder applies, mirrored for expected test values. */
const MULTIPLIERS = { medium: 1, large: 2, tiny: 0.5 };


/** Cases the calculation test pins. */
const CASES = [
  ['matches the burden table for STR 10 medium biped', 10, 'medium', false],
  ['matches STR 15 medium biped', 15, 'medium', false],
  ['doubles all thresholds for Large bipeds', 15, 'large', false],
  ['uses quadruped multiplier 1.5 at Medium', 10, 'medium', true],
  ['uses quadruped multiplier 3 at Large', 15, 'large', true],
  ['halves thresholds at Tiny', 10, 'tiny', false],
  ['applies the quadruped multiplier below Medium', 10, 'tiny', true],
  ['reads STR 30 from the extended table', 30, 'medium', false],
  [`reads STR ${MAX_STRENGTH} from the extended table`, MAX_STRENGTH, 'medium', false],
  [`clamps STR above ${MAX_STRENGTH} to the STR ${MAX_STRENGTH} row`, MAX_STRENGTH + 15, 'medium', false],
];

/**
 * Renders one `toEqual` threshold literal.
 *
 * @param {{ light: number, medium: number, heavy: number }} value - Thresholds.
 * @param {string} indent - Indent of the closing brace.
 * @returns {string} Object literal source.
 */
function thresholdLiteral(value, indent) {
  return `{\n${indent}  light: ${value.light},\n${indent}  medium: ${value.medium},\n${indent}  heavy: ${value.heavy},\n${indent}}`;
}

/**
 * Rewrites the calculation test from the new table.
 *
 * @param {string} text - Test file text.
 * @param {ReturnType<typeof burdenTable>} rows - Burden rows.
 * @returns {string} New text.
 */
export function rewriteComputeTest(text, rows) {
  const eol = eolOf(text);
  const lf = text.replace(/\r\n/g, '\n');
  const head = lf.slice(0, lf.indexOf("describe('computeCapacity'"));
  if (!head) {
    throw new Error(`${COMPUTE_TEST}: describe block not found`);
  }
  const byStrength = new Map(rows.map((row) => [row.strength, row]));
  const blocks = CASES.map(([title, strength, size, quadruped]) => {
    const row = byStrength.get(Math.min(strength, MAX_STRENGTH));
    const factor = MULTIPLIERS[size] * (quadruped ? 1.5 : 1);
    const value = {
      light: Math.floor(row.light * factor),
      medium: Math.floor(row.medium * factor),
      heavy: Math.floor(row.heavy * factor),
    };
    return `  it('${title}', () => {\n    expect(computeCapacity(${strength}, '${size}', ${quadruped})).toEqual(${thresholdLiteral(value, '    ')});\n  });\n`;
  });
  const zero = `  it('returns zeros for STR below 1', () => {\n    expect(computeCapacity(0, 'medium', false)).toEqual(${thresholdLiteral({ light: 0, medium: 0, heavy: 0 }, '    ')});\n  });\n`;
  return `${head}describe('computeCapacity', () => {\n${[...blocks, zero].join('\n')}});\n`.replace(/\n/g, eol);
}

/**
 * Rewrites a re-export test's STR 10 expectation.
 *
 * @param {string} text - Test file text.
 * @param {ReturnType<typeof burdenTable>} rows - Burden rows.
 * @param {string} path - File path for the error.
 * @returns {string} New text.
 */
export function rewriteReexportTest(text, rows, path) {
  const row = rows.find((entry) => entry.strength === 10);
  const anchor = /light: 33,(\r?\n\s*)medium: 66,(\r?\n\s*)heavy: 100,/;
  if (!anchor.test(text)) {
    throw new Error(`${path}: STR 10 expectation not found`);
  }
  return text.replace(
    anchor,
    (_, first, second) => `light: ${row.light},${first}medium: ${row.medium},${second}heavy: ${row.heavy},`,
  );
}

/**
 * Relabels the builder's weight strings from pounds to burdens.
 *
 * @param {string} text - characterSheet.json text.
 * @returns {string} New text.
 */
export function rewriteLabels(text) {
  let next = text;
  for (const label of LABELS) {
    const found = next.split(label.from).length - 1;
    if (found !== label.count) {
      throw new Error(`${MESSAGES_FILE}: expected ${label.count} of ${label.from}, found ${found}`);
    }
    next = next.split(label.from).join(label.to);
  }
  return next;
}

/**
 * Rewrites pounds to burdens on JSDoc lines only, failing when the line count drifts.
 *
 * @param {string} text - Source text.
 * @param {{ path: string, lines: number }} file - Target file and expected changed lines.
 * @returns {string} New text.
 */
export function rewriteJsdocUnits(text, file) {
  let changed = 0;
  const next = mapLines(text, (line) => {
    if (!/^\s*(\/\*\*|\*)/.test(line)) {
      return line;
    }
    const out = line.replace(/\bpounds\b/g, 'burdens').replace(/\bweight lb\b/g, 'weight in burdens');
    if (out !== line) {
      changed += 1;
    }
    return out;
  });
  if (changed !== file.lines) {
    throw new Error(`${file.path}: expected ${file.lines} JSDoc line(s) naming pounds, found ${changed}`);
  }
  return next;
}

/**
 * Runs the codemod.
 *
 * @param {(path: string) => string} read - File reader.
 * @returns {{ edits: Array<{ path: string, before: string, after: string }>, rows: ReturnType<typeof burdenTable>, deleted: string[] }} Edits, the table and the deleted page lines.
 */
export function run(read) {
  const page = read(RULE_FILE);
  const rewritten = rewritePage(page);
  const edits = [
    { path: RULE_FILE, before: page, after: rewritten.text },
    { path: CONSTANTS_FILE, before: read(CONSTANTS_FILE), after: '' },
    { path: COMPUTE_FILE, before: read(COMPUTE_FILE), after: '' },
    { path: COMPUTE_TEST, before: read(COMPUTE_TEST), after: '' },
    ...REEXPORT_TESTS.map((path) => ({ path, before: read(path), after: '' })),
  ];
  edits[1].after = rewriteLoadPenalties(rewriteConstants(edits[1].before, rewritten.rows));
  edits[2].after = rewriteCompute(edits[2].before);
  edits[3].after = rewriteComputeTest(edits[3].before, rewritten.rows);
  for (const edit of edits.slice(4)) {
    edit.after = rewriteReexportTest(edit.before, rewritten.rows, edit.path);
  }
  const messages = read(MESSAGES_FILE);
  edits.push({ path: MESSAGES_FILE, before: messages, after: rewriteLabels(messages) });
  for (const file of JSDOC_FILES) {
    const before = read(file.path);
    edits.push({ path: file.path, before, after: rewriteJsdocUnits(before, file) });
  }
  return { edits, rows: rewritten.rows, deleted: rewritten.deleted };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const result = run(readText);
  const notes = [
    `## Table rows: ${result.rows.length} (STR 1-${MAX_STRENGTH})`,
    `## Deleted page lines: ${result.deleted.length}`,
    ...result.deleted.map((line) => `> ${line}`),
  ];
  emit('codemod-burden-capacity', result.edits, parseFlags(process.argv.slice(2)), notes);
}
