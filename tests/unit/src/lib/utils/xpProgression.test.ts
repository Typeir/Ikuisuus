/**
 * @fileoverview Tests for xpProgression utilities
 * @description Unit tests for getLevelFromXP, getXPForLevel, and getXPProgressPercent.
 *
 * @module tests/unit/src/lib/utils/xpProgression.test
 */

import {
  getLevelFromXP,
  getXPForLevel,
  getXPProgressPercent,
  MAX_XP_LEVEL,
} from '@/lib/utils/xpProgression';
import { describe, expect, it } from 'vitest';

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 1 for XP just below the threshold for level 2 (299)', () => {
    expect(getLevelFromXP(299)).toBe(1);
  });

  it('returns level 2 at exactly 300 XP', () => {
    expect(getLevelFromXP(300)).toBe(2);
  });

  it('returns level 19 just below the threshold for level 20 (354 999)', () => {
    expect(getLevelFromXP(354999)).toBe(19);
  });

  it('returns level 20 at exactly 355 000 XP', () => {
    expect(getLevelFromXP(355000)).toBe(20);
  });

  it('caps at MAX_XP_LEVEL for very large XP values', () => {
    expect(getLevelFromXP(9999999)).toBe(MAX_XP_LEVEL);
  });
});

describe('getXPForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(getXPForLevel(1)).toBe(0);
  });

  it('returns 300 for level 2', () => {
    expect(getXPForLevel(2)).toBe(300);
  });

  it('returns 355 000 for level 20', () => {
    expect(getXPForLevel(20)).toBe(355000);
  });

  it('returns 0 for level 21 (no XP threshold defined)', () => {
    expect(getXPForLevel(21)).toBe(0);
  });

  it('returns 0 for level below 1', () => {
    expect(getXPForLevel(0)).toBe(0);
  });
});

describe('getXPProgressPercent', () => {
  it('returns 0 at the floor of a level', () => {
    expect(getXPProgressPercent(0)).toBe(0);
  });

  it('returns 100 at MAX_XP_LEVEL', () => {
    expect(getXPProgressPercent(355000)).toBe(100);
  });

  it('returns 100 for XP above MAX_XP_LEVEL threshold', () => {
    expect(getXPProgressPercent(9999999)).toBe(100);
  });

  it('returns a mid-range value for XP halfway through a level', () => {
    const halfway = Math.round((0 + 300) / 2);
    const percent = getXPProgressPercent(halfway);
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100);
  });
});
