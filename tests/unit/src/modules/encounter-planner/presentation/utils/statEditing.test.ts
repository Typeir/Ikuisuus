/**
 * @fileoverview Tests for statEditing utility functions
 * @description Validates parseIntSafe, clampNonNegative, and getModifierString
 * across normal, edge-case, and boundary inputs.
 */

import {
  clampNonNegative,
  getModifierString,
  parseIntSafe,
} from '@/modules/encounter-planner/presentation/utils/statEditing';
import { describe, expect, it } from 'vitest';

describe('parseIntSafe', () => {
  it('should parse valid integer strings', () => {
    expect(parseIntSafe('10')).toBe(10);
    expect(parseIntSafe('0')).toBe(0);
    expect(parseIntSafe('-5')).toBe(-5);
    expect(parseIntSafe('100')).toBe(100);
  });

  it('should return 0 for NaN strings', () => {
    expect(parseIntSafe('abc')).toBe(0);
    expect(parseIntSafe('xyz')).toBe(0);
  });

  it('should return 0 for empty string when allowEmpty is false', () => {
    expect(parseIntSafe('')).toBe(0);
    expect(parseIntSafe('', false)).toBe(0);
  });

  it('should return null for empty string when allowEmpty is true', () => {
    expect(parseIntSafe('', true)).toBeNull();
  });

  it('should truncate decimal strings to integer', () => {
    expect(parseIntSafe('3.7')).toBe(3);
    expect(parseIntSafe('10.99')).toBe(10);
  });

  it('should parse strings with leading whitespace-like chars', () => {
    expect(parseIntSafe('  42')).toBe(42);
  });
});

describe('clampNonNegative', () => {
  it('should pass through positive values unchanged', () => {
    expect(clampNonNegative(5)).toBe(5);
    expect(clampNonNegative(100)).toBe(100);
  });

  it('should clamp negative values to 0', () => {
    expect(clampNonNegative(-1)).toBe(0);
    expect(clampNonNegative(-100)).toBe(0);
  });

  it('should pass through zero unchanged', () => {
    expect(clampNonNegative(0)).toBe(0);
  });

  it('should preserve null', () => {
    expect(clampNonNegative(null)).toBeNull();
  });
});

describe('getModifierString', () => {
  it('should return "+0" for score 10 and 11', () => {
    expect(getModifierString(10)).toBe('+0');
    expect(getModifierString(11)).toBe('+0');
  });

  it('should return positive modifiers for scores above 11', () => {
    expect(getModifierString(12)).toBe('+1');
    expect(getModifierString(14)).toBe('+2');
    expect(getModifierString(16)).toBe('+3');
    expect(getModifierString(20)).toBe('+5');
    expect(getModifierString(30)).toBe('+10');
  });

  it('should return negative modifiers for scores below 10', () => {
    expect(getModifierString(8)).toBe('-1');
    expect(getModifierString(6)).toBe('-2');
    expect(getModifierString(1)).toBe('-5');
  });

  it('should handle the minimum meaningful score', () => {
    expect(getModifierString(1)).toBe('-5');
  });
});
