/**
 * @fileoverview Native Measure Tests
 * @description Converts stored markdown measures to native form.
 *
 * @module tests/unit/src/lib/units/nativeMeasure.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 *
 * @requires vitest Testing framework
 */

import { splitMeasures, toNativeMeasure } from '@/lib/units/nativeMeasure';
import { describe, expect, it } from 'vitest';

describe('toNativeMeasure', () => {
  it('should unwrap an authoring expression to its bare measure', () => {
    expect(toNativeMeasure('[= 12 stride =]')).toBe('12 stride');
  });

  it('should keep the prose around a measure', () => {
    expect(toNativeMeasure('Walk: [= 5 stride =]')).toBe('Walk: 5 stride');
  });

  it('should rewrite every measure in a list', () => {
    expect(
      toNativeMeasure('[= 8 stride =], burrow [= 4 stride =], swim [= 12 stride =]'),
    ).toBe('8 stride, burrow 4 stride, swim 12 stride');
  });

  /** `;ADJ` is what renders "6-stride cone" rather than "6 strides cone". */
  it('should preserve a flag', () => {
    expect(toNativeMeasure('Self ([= 6 stride;ADJ =] cone)')).toBe(
      'Self (6 stride;ADJ cone)',
    );
  });

  it('should convert an imperial distance into strides', () => {
    expect(toNativeMeasure('60 Feet')).toBe('12 stride');
    expect(toNativeMeasure('15ft')).toBe('3 stride');
  });

  /** Seven feet equals 7/5 stride. */
  it('should convert an inexact imperial distance as a fraction', () => {
    expect(toNativeMeasure('7 feet')).toBe('7/5 stride');
  });

  it('should convert pounds into burden', () => {
    expect(toNativeMeasure('1 lb')).toBe('1/2 burden');
  });

  it('should leave a keyword range alone', () => {
    expect(toNativeMeasure('Self')).toBe('Self');
    expect(toNativeMeasure('30/90')).toBe('30/90');
  });

  /** A generator may normalise a value it has already normalised. */
  it('should be idempotent', () => {
    const once = toNativeMeasure('Self ([= 6 stride;ADJ =] cone)');
    expect(toNativeMeasure(once)).toBe(once);
  });
});

describe('splitMeasures', () => {
  it('should separate measures from the prose around them', () => {
    expect(splitMeasures('Self (6 stride;ADJ cone)')).toEqual([
      { text: 'Self (' },
      {
        text: '6 stride;ADJ',
        numerator: 6,
        denominator: 1,
        unit: 'stride',
        flags: 'ADJ',
      },
      { text: ' cone)' },
    ]);
  });

  it('should read a fractional measure', () => {
    expect(splitMeasures('7/5 stride')).toEqual([
      {
        text: '7/5 stride',
        numerator: 7,
        denominator: 5,
        unit: 'stride',
        flags: undefined,
      },
    ]);
  });

  it('should return prose untouched when there is no measure', () => {
    expect(splitMeasures('Self')).toEqual([{ text: 'Self' }]);
  });
});
