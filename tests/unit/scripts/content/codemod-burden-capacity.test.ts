/**
 * @fileoverview Tests for the carrying-capacity burden codemod.
 * @description The table follows the stepped rule ruled on 11 Nov 2026, and the page edits stay scoped.
 *
 * @module tests/unit/scripts/content/codemod-burden-capacity.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-11-11
 */

import { describe, expect, it } from 'vitest';
import {
  AUTHORED_INTRO,
  AUTHORED_PENALTIES,
  MAX_STRENGTH,
  burdenTable,
  heavyAt,
  rewriteJsdocUnits,
  rewriteLabels,
  rewriteLoadPenalties,
  rewritePage,
  stepAt,
} from '../../../../scripts/content/codemod-burden-capacity.mjs';

/** Heavy Load at band edges: 6 per point to 20, then 12, 18, 24, and so on. */
const HEAVY: Array<[number, number]> = [
  [1, 6],
  [10, 60],
  [20, 120],
  [21, 132],
  [30, 240],
  [31, 258],
  [40, 420],
  [50, 660],
  [60, 960],
  [70, 1320],
  [80, 1740],
];

describe('stepAt', () => {
  it.each([
    [1, 6],
    [20, 6],
    [21, 12],
    [30, 12],
    [31, 18],
    [41, 24],
    [80, 42],
  ])('gives STR %i a step of %i', (strength, step) => {
    expect(stepAt(strength)).toBe(step);
  });
});

describe('burdenTable', () => {
  const rows = burdenTable(MAX_STRENGTH);

  it('lists STR 1 to 80', () => {
    expect(rows.map((row) => row.strength)).toEqual(Array.from({ length: 80 }, (_, index) => index + 1));
  });

  it.each(HEAVY)('gives STR %i a Heavy Load of %i', (strength, heavy) => {
    expect(heavyAt(strength)).toBe(heavy);
    expect(rows[strength - 1]).toEqual({ strength, light: heavy / 3, medium: (heavy * 2) / 3, heavy });
  });

  it('keeps every threshold a whole burden', () => {
    for (const row of rows) {
      expect(Number.isInteger(row.light) && Number.isInteger(row.medium)).toBe(true);
    }
  });
});

describe('rewriteLabels', () => {
  const messages = [
    '  "equipmentColWeight": "Weight (lb)",',
    '  "carryingCapacityCarried": "Carried (lb)",',
    '  "carryingCapacityCarriedAria": "Carried weight in pounds",',
    '  "carryingCapacityLight": "Light ≤ {weight} lb",',
    '  "carryingCapacityMedium": "Medium ≤ {weight} lb",',
    '  "carryingCapacityHeavy": "Heavy ≤ {weight} lb",',
  ].join('\n');

  it('relabels every weight string to burdens', () => {
    const next = rewriteLabels(messages);
    expect(next).not.toMatch(/\blb\b|pounds/);
    expect(next).toContain('"Heavy ≤ {weight} burden"');
    expect(next).toContain('"Weight (burden)"');
  });

  it('refuses when a label drifted', () => {
    expect(() => rewriteLabels(messages.replace('Weight (lb)', 'Weight'))).toThrow(/Weight \(lb\)/);
  });
});

describe('rewriteJsdocUnits', () => {
  const source = '/**\n * Sums weight in pounds.\n */\nconst pounds = 1;\n';

  it('rewrites JSDoc lines only', () => {
    expect(rewriteJsdocUnits(source, { path: 'probe.ts', lines: 1 })).toBe(
      '/**\n * Sums weight in burdens.\n */\nconst pounds = 1;\n',
    );
  });

  it('refuses when the line count drifts', () => {
    expect(() => rewriteJsdocUnits(source, { path: 'probe.ts', lines: 2 })).toThrow(/probe\.ts/);
  });
});

describe('rewriteLoadPenalties', () => {
  const source = [
    'const A = 1;',
    '/**',
    ' * Speed and skill penalties applied at each load tier.',
    ' *',
    ' * @constant LOAD_PENALTIES',
    ' */',
    'export const LOAD_PENALTIES = {',
    '  light: {',
    '    checkPenalty: 0,',
    '  },',
    '};',
    '',
  ].join('\r\n');

  it('replaces the block with the four ruled tiers', () => {
    const next = rewriteLoadPenalties(source);
    expect(next.startsWith('const A = 1;\r\n/**')).toBe(true);
    expect(next).not.toContain('checkPenalty');
    expect(next).toContain("  over: { speedLoss: 0, speedFactor: 1, maxSpeed: 1, dodgeFactor: 0, disadvantage: 'all' },");
    expect(next.endsWith('} as const;\r\n')).toBe(true);
    expect(next).not.toMatch(/[^\r]\n/);
  });
});

describe('rewritePage', () => {
  const page = [
    '## Carrying Capacity by Strength',
    '',
    'Values at every **Strength Score** from 1 to 29, for a Medium creature.',
    '',
    '| Strength | Light Load | Medium Load | Heavy Load |',
    '| -------- | ---------- | ----------- | ---------- |',
    ...Array.from({ length: 29 }, (_, index) => `| ${index + 1} | 0 | 0 | ${10 * (index + 1)} |`),
    '',
    '## Load Penalties',
    '',
    '| Load   | Max DEX | Check Penalty |',
    '| ------ | ------- | ------------- |',
    '| Heavy  | +1      | −6            |',
    '',
    'A medium load costs a third of your speed; a heavy load costs half.',
    '',
    '**Check Penalty** applies to every Strength-based check.',
    '',
    '**Max DEX** caps the DEX you add to Dodge.',
    '',
    '## Lifting and Dragging',
    '',
    '## Quadruped Multipliers',
    '',
    'A quadruped (or other creature with a markedly load-bearing frame) replaces its size multiplier with the quadruped value at Medium and larger sizes:',
    '',
    '| Medium | ×1.5 |',
    '',
    'Sizes smaller than Medium continue to use the bipedal size multipliers from the previous table.',
    '',
    '## Tremendous Strength',
    '',
    'Above 29, multiply by 4.',
    '',
    '---',
    '',
    'See also.',
    '',
  ].join('\r\n');

  const result = rewritePage(page);
  const lines = result.text.split('\r\n');

  it('replaces the intro paragraph with the authored rule', () => {
    expect(lines.slice(2, 2 + AUTHORED_INTRO.length)).toEqual([...AUTHORED_INTRO]);
    expect(result.text).not.toContain('from 1 to 29');
    expect(lines[2 + AUTHORED_INTRO.length]).toBe('');
    expect(lines[3 + AUTHORED_INTRO.length]).toBe('| Strength | Light Load | Medium Load | Heavy Load |');
  });

  it('writes 80 rows with thousands separators', () => {
    expect(lines.filter((line) => /^\| \d/.test(line))).toHaveLength(80);
    expect(lines).toContain('| 80       | 580        | 1,160       | 1,740      |');
  });

  it('deletes the Tremendous Strength section and keeps the separator clean', () => {
    expect(result.text).not.toContain('Tremendous');
    expect(lines.slice(-6)).toEqual(['| Medium | ×1.5 |', '', '---', '', 'See also.', '']);
    expect(result.deleted[0]).toBe('## Tremendous Strength');
  });

  it('swaps the penalty table for the authored one and drops the superseded prose', () => {
    const at = lines.indexOf('## Load Penalties');
    expect(lines.slice(at + 2, at + 2 + AUTHORED_PENALTIES.length)).toEqual([...AUTHORED_PENALTIES]);
    expect(lines.slice(at + 2 + AUTHORED_PENALTIES.length, at + 4 + AUTHORED_PENALTIES.length)).toEqual([
      '',
      '## Lifting and Dragging',
    ]);
    expect(result.text).not.toMatch(/Check Penalty|Max DEX|a third of your speed/);
    expect(result.text).toContain('Max Speed is [= 1 stride =]');
  });

  it('drops the Medium-and-larger limit on quadrupeds', () => {
    expect(lines).toContain(
      'A quadruped (or other creature with a markedly load-bearing, or many-limbed frame) replaces its size multiplier with the quadruped value:',
    );
    expect(result.text).not.toContain('Sizes smaller than Medium');
    expect(result.text).not.toContain('at Medium and larger sizes');
  });
});
