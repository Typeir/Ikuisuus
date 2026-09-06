/**
 * @fileoverview Tests for the casting tables.
 *
 * @module tests/unit/src/modules/library/domain/castingTables.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import {
  castingColumns,
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_CASTER,
  POINT_CASTER,
  slotOrdinal,
  THIRD_CASTER_SLOTS,
} from '@/modules/library/domain/castingTables';
import { describe, expect, it } from 'vitest';

describe('casting tables', () => {
  it('run to 30 for a full caster and 20 for the rest', () => {
    expect(FULL_CASTER_SLOTS).toHaveLength(30);
    expect(HALF_CASTER_SLOTS).toHaveLength(20);
    expect(THIRD_CASTER_SLOTS).toHaveLength(20);
    expect(POINT_CASTER).toHaveLength(20);
    expect(PACT_CASTER).toHaveLength(20);
  });

  it('match the corpus at the rows a reader checks first', () => {
    expect(FULL_CASTER_SLOTS[19]).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    expect(FULL_CASTER_SLOTS[29]).toEqual([4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1]);
    expect(HALF_CASTER_SLOTS[4]).toEqual([4, 2]);
    expect(THIRD_CASTER_SLOTS[2]).toEqual([2]);
    expect(POINT_CASTER[19]).toEqual([120, 9]);
    expect(PACT_CASTER[10]).toEqual([3, 5]);
  });
});

describe('slotOrdinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
  ])('%i → %s', (level, text) => {
    expect(slotOrdinal(level)).toBe(text);
  });
});

describe('castingColumns', () => {
  it('prints as many slot columns as the range reaches', () => {
    const twenty = castingColumns('full', 20);
    expect(twenty.columns).toEqual(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']);
    expect(twenty.cells[0]).toEqual(['2', '', '', '', '', '', '', '', '']);
    const thirty = castingColumns('full', 30);
    expect(thirty.columns).toHaveLength(12);
    expect(thirty.cells[29]).toEqual(['4', '4', '4', '3', '3', '3', '3', '2', '2', '2', '1', '1']);
  });

  it('leaves a third caster empty before level 3 and a half caster at five columns', () => {
    const third = castingColumns('third', 20);
    expect(third.columns).toEqual(['1st', '2nd', '3rd', '4th']);
    expect(third.cells[1]).toEqual(['', '', '', '']);
    expect(third.cells[2]).toEqual(['2', '', '', '']);
    expect(castingColumns('half', 20).columns).toHaveLength(5);
  });

  it('prints the two named columns of a point or pact caster, empty past the table', () => {
    const points = castingColumns('points', 22);
    expect(points.columns).toEqual(['Spell Points', 'Max Spell Level']);
    expect(points.cells[0]).toEqual(['2', '1']);
    expect(points.cells[21]).toEqual(['', '']);
    const pact = castingColumns('pact', 20);
    expect(pact.columns).toEqual(['Spell Slots', 'Slot Level']);
    expect(pact.cells[19]).toEqual(['4', '5']);
  });
});
