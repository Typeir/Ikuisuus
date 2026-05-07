/**
 * @fileoverview carryingCapacity Unit Tests
 *
 * @module tests/unit/lib/data/carryingCapacity
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { computeCapacity } from '@/lib/data/carryingCapacity';
import { describe, expect, it } from 'vitest';

describe('computeCapacity', () => {
  it('matches the canonical 3.5e values for STR 10 medium biped', () => {
    expect(computeCapacity(10, 'medium', false)).toEqual({
      light: 33,
      medium: 66,
      heavy: 100,
    });
  });

  it('matches STR 15 medium biped', () => {
    expect(computeCapacity(15, 'medium', false)).toEqual({
      light: 66,
      medium: 133,
      heavy: 200,
    });
  });

  it('doubles all thresholds for Large bipeds', () => {
    expect(computeCapacity(15, 'large', false)).toEqual({
      light: 132,
      medium: 266,
      heavy: 400,
    });
  });

  it('uses quadruped multiplier 1.5 at Medium', () => {
    expect(computeCapacity(10, 'medium', true)).toEqual({
      light: 49,
      medium: 99,
      heavy: 150,
    });
  });

  it('uses quadruped multiplier 3 at Large', () => {
    expect(computeCapacity(15, 'large', true)).toEqual({
      light: 198,
      medium: 399,
      heavy: 600,
    });
  });

  it('halves thresholds at Tiny', () => {
    expect(computeCapacity(10, 'tiny', false)).toEqual({
      light: 16,
      medium: 33,
      heavy: 50,
    });
  });

  it('applies tremendous-strength multiplier at STR 30 (= STR 20 ×4)', () => {
    expect(computeCapacity(30, 'medium', false)).toEqual({
      light: 532,
      medium: 1064,
      heavy: 1600,
    });
  });

  it('applies tremendous-strength multiplier at STR 39 (= STR 29 ×4)', () => {
    expect(computeCapacity(39, 'medium', false)).toEqual({
      light: 1864,
      medium: 3732,
      heavy: 5600,
    });
  });

  it('applies tremendous-strength multiplier at STR 40 (= STR 20 ×16)', () => {
    expect(computeCapacity(40, 'medium', false)).toEqual({
      light: 2128,
      medium: 4256,
      heavy: 6400,
    });
  });

  it('returns zeros for STR below 1', () => {
    expect(computeCapacity(0, 'medium', false)).toEqual({
      light: 0,
      medium: 0,
      heavy: 0,
    });
  });
});
