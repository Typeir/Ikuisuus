/**
 * @fileoverview Tests for the progression table builder.
 *
 * @module tests/unit/src/modules/library/domain/progression.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import {
  buildProgression,
  expandColumn,
  featuresText,
  lastLevel,
  parseLevels,
  parseSpecialization,
  tierBonusAt,
} from '@/modules/library/domain/progression';
import { describe, expect, it } from 'vitest';

const ROGUE = {
  feats: [4, 8, 10, 12, 16],
  specialization: { label: 'Specialization', levels: [9, 13, 17] },
  headings: [
    { level: 1, name: 'Expertise' },
    { level: 1, name: 'Sneak Attack' },
    { level: 3, name: 'Steady Aim' },
    { level: 3, name: 'Rogue Specialization' },
    { level: 19, name: 'Epic Boon' },
    { level: 20, name: 'Stroke of Luck' },
  ],
  columns: [
    { label: 'Features', entries: [{ at: 6, value: 'Expertise' }] },
    {
      label: 'Sneak Attack',
      entries: [
        { at: 1, value: '1d6' },
        { at: 3, value: '2d6' },
        { at: 5, value: '3d6' },
      ],
    },
  ],
};

describe('parsing', () => {
  it('reads levels and a specialization declaration', () => {
    expect(parseLevels('4, 8, 12')).toEqual([4, 8, 12]);
    expect(parseLevels(' 4 8 x 12 ')).toEqual([4, 8, 12]);
    expect(parseLevels(undefined)).toEqual([]);
    expect(parseSpecialization('Id: 6, 10, 14')).toEqual({ label: 'Id', levels: [6, 10, 14] });
    expect(parseSpecialization('9, 13')).toEqual({ label: 'Specialization', levels: [9, 13] });
    expect(parseSpecialization('')).toBeUndefined();
  });

  it('steps the tier bonus every three levels from one', () => {
    expect([1, 3, 4, 6, 7, 20, 30].map(tierBonusAt)).toEqual([1, 1, 2, 2, 3, 7, 10]);
  });
});

describe('expandColumn', () => {
  it('carries a row forward until the next, and keeps a unique row to its level', () => {
    const column = {
      label: 'x',
      entries: [
        { at: 3, value: 'a' },
        { at: 5, value: 'b', unique: true },
        { at: 7, value: 'c' },
      ],
    };
    expect(expandColumn(column, 8)).toEqual([undefined, undefined, 'a', 'a', 'b', 'a', 'c', 'c']);
  });

  it('places rows without at after the previous one, from level 1', () => {
    const column = { label: 'x', entries: [{ value: 'a' }, { value: 'b' }, { at: 5, value: 'c' }, { value: 'd' }] };
    expect(expandColumn(column, 7)).toEqual(['a', 'b', 'b', 'b', 'c', 'd', 'd']);
  });

  it('reads an array as one value per level, the last carried forward', () => {
    expect(expandColumn({ label: 'x', values: ['1', '2', '3'] }, 5)).toEqual(['1', '2', '3', '3', '3']);
    expect(expandColumn({ label: 'x', values: [] }, 2)).toEqual([undefined, undefined]);
  });
});

describe('lastLevel', () => {
  it('is 20 unless something declares more, or the spec says', () => {
    expect(lastLevel({ headings: [], columns: [] })).toBe(20);
    expect(lastLevel({ headings: [{ level: 21, name: 'Divine Will' }], columns: [] })).toBe(21);
    expect(lastLevel({ headings: [], columns: [{ label: 'x', values: Array(22).fill('1') }] })).toBe(22);
    expect(lastLevel({ headings: [], columns: [], feats: [25] })).toBe(25);
    expect(lastLevel({ headings: [], columns: [], levels: 12 })).toBe(12);
  });
});

describe('buildProgression', () => {
  it('names the columns after Level, Tier Bonus and Features, casting last', () => {
    const table = buildProgression({ ...ROGUE, casting: 'third' });
    expect(table.columns).toEqual(['Sneak Attack', '1st', '2nd', '3rd', '4th']);
    expect(table.rows).toHaveLength(20);
  });

  it('fills the features cell from headings, milestones, feats and the specialization word', () => {
    const table = buildProgression(ROGUE);
    const cell = (level: number) => featuresText(table.rows[level - 1].features);
    expect(cell(1)).toBe('Expertise, Sneak Attack');
    expect(cell(2)).toBe('—');
    expect(cell(3)).toBe('Steady Aim, Rogue Specialization');
    expect(cell(4)).toBe('Feat');
    expect(cell(6)).toBe('Expertise');
    expect(cell(7)).toBe('—');
    expect(cell(9)).toBe('Specialization Feature');
    expect(cell(19)).toBe('Epic Boon');
    expect(table.rows[8].features.map((f) => f.kind)).toEqual(['specialization']);
  });

  it('prints a feat once when a heading already names it', () => {
    const table = buildProgression({
      headings: [{ level: 4, name: 'Feat' }],
      feats: [4, 8],
      columns: [],
    });
    expect(featuresText(table.rows[3].features)).toBe('Feat');
    expect(featuresText(table.rows[7].features)).toBe('Feat');
  });

  it('takes its own words for the feat and specialization rows', () => {
    const table = buildProgression(
      { headings: [], feats: [4], specialization: { label: 'Id', levels: [6] }, columns: [] },
      { feat: 'Talent', specialization: (label) => `${label} talent` },
    );
    expect(featuresText(table.rows[3].features)).toBe('Talent');
    expect(featuresText(table.rows[5].features)).toBe('Id talent');
  });

  it('lays the cells out as declared columns then casting cells, with tier bonus per row', () => {
    const table = buildProgression({ ...ROGUE, casting: 'third' });
    expect(table.rows[0]).toMatchObject({ level: 1, tierBonus: 1, cells: ['1d6', '', '', '', ''] });
    expect(table.rows[2].cells).toEqual(['2d6', '2', '', '', '']);
    expect(table.rows[19].cells).toEqual(['3d6', '4', '3', '3', '1']);
  });

  it('prints a milestone value that is not a string through the given text', () => {
    const table = buildProgression<{ dice: string }>({
      headings: [],
      columns: [{ label: 'Features', entries: [{ at: 2, value: { dice: '1d6' } }] }],
    });
    expect(featuresText(table.rows[1].features, (v) => v.dice)).toBe('1d6');
  });
});
