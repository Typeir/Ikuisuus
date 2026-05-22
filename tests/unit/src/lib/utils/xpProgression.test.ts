/**
 * @fileoverview Tests for xpProgression utilities
 * @description Unit tests for getLevelFromXP, getXPForLevel, and getXPProgressPercent.
 * Covers the full level 1–30 range including epic levels 21–30.
 *
 * @module tests/unit/src/lib/utils/xpProgression.test
 */

import {
    getLevelFromXP,
    getXpAxisPosition,
    getXPForLevel,
    getXPProgressPercent,
    MAX_XP_LEVEL,
    XP_THRESHOLDS,
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

  it('returns level 21 at exactly 500 000 XP (epic level gate)', () => {
    expect(getLevelFromXP(500000)).toBe(21);
  });

  it('returns level 30 at exactly 3 000 000 XP', () => {
    expect(getLevelFromXP(3000000)).toBe(30);
  });

  it('caps at MAX_XP_LEVEL (30) for very large XP values', () => {
    expect(getLevelFromXP(9999999)).toBe(MAX_XP_LEVEL);
    expect(MAX_XP_LEVEL).toBe(30);
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

  it('returns 500 000 for level 21 (epic levels exist)', () => {
    expect(getXPForLevel(21)).toBe(500000);
  });

  it('returns 3 000 000 for level 30', () => {
    expect(getXPForLevel(30)).toBe(3000000);
  });

  it('returns 0 for level 31 (beyond max)', () => {
    expect(getXPForLevel(31)).toBe(0);
  });

  it('returns 0 for level below 1', () => {
    expect(getXPForLevel(0)).toBe(0);
  });
});

describe('getXPProgressPercent', () => {
  it('returns 0 at the floor of a level', () => {
    expect(getXPProgressPercent(0)).toBe(0);
  });

  it('returns 100 at MAX_XP_LEVEL (3 000 000 XP for level 30)', () => {
    expect(getXPProgressPercent(3000000)).toBe(100);
  });

  it('returns 100 for XP above the level-30 threshold', () => {
    expect(getXPProgressPercent(9999999)).toBe(100);
  });

  it('returns a mid-range value for XP halfway through level 1', () => {
    const halfway = Math.round((0 + 300) / 2);
    const percent = getXPProgressPercent(halfway);
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100);
  });

  it('returns 0 at the exact XP floor of level 20 (no longer the cap)', () => {
    expect(getXPProgressPercent(355000)).toBe(0);
  });

  it('returns a mid-range value between level 20 and 21 (epic range)', () => {
    const midway = Math.round((355000 + 500000) / 2);
    const percent = getXPProgressPercent(midway);
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100);
  });
});

/**
 * @fileoverview Tests for getXpAxisPosition
 * @description Verifies the power-law XP axis helper used to render
 * the overall XP bar — zero boundary, max boundary, monotonicity,
 * diminishing-returns slope, and growing level-segment property.
 */
describe('getXpAxisPosition', () => {
  it('returns 0 at XP 0', () => {
    expect(getXpAxisPosition(0)).toBe(0);
  });

  it('returns 100 at the maximum XP threshold', () => {
    expect(getXpAxisPosition(XP_THRESHOLDS[MAX_XP_LEVEL])).toBeCloseTo(100, 5);
  });

  it('clamps below 0 to 0', () => {
    expect(getXpAxisPosition(-100)).toBe(0);
  });

  it('clamps above max to 100', () => {
    expect(getXpAxisPosition(XP_THRESHOLDS[MAX_XP_LEVEL] + 999999)).toBeCloseTo(
      100,
      5,
    );
  });

  it('is strictly monotonically increasing across all level thresholds', () => {
    let prev = getXpAxisPosition(XP_THRESHOLDS[1]);
    for (let lvl = 2; lvl <= MAX_XP_LEVEL; lvl++) {
      const curr = getXpAxisPosition(XP_THRESHOLDS[lvl]);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });

  it('places level 20 threshold near 50% of the bar (power curve sanity)', () => {
    const pos = getXpAxisPosition(XP_THRESHOLDS[20]);
    expect(pos).toBeGreaterThan(45);
    expect(pos).toBeLessThan(55);
  });

  it('shows diminishing returns: slope is steeper at the start than at the end', () => {
    const delta = 1000;
    const slopeStart = getXpAxisPosition(delta) - getXpAxisPosition(0);
    const maxXp = XP_THRESHOLDS[MAX_XP_LEVEL];
    const slopeEnd =
      getXpAxisPosition(maxXp) - getXpAxisPosition(maxXp - delta);
    expect(slopeStart).toBeGreaterThan(slopeEnd);
  });
});
