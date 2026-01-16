/**
 * tableUtils Unit Tests
 *
 * @fileoverview Tests for table sorting and comparison utilities.
 * Validates order-based comparison, Challenge Rating parsing, and specialized comparators.
 *
 * @module tests/unit/lib/utils/tableUtils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/tableUtils Module under test
 */

import { describe, it, expect } from 'vitest';
import {
  compareByOrder,
  parseChallengeRating,
  compareChallengeRating,
} from '@/lib/utils/tableUtils';

describe('compareByOrder', () => {
  const SIZE_ORDER = {
    tiny: 1,
    small: 2,
    medium: 3,
    large: 4,
    huge: 5,
    gargantuan: 6,
  };

  describe('basic comparison', () => {
    it('should return negative when first value has lower order', () => {
      expect(compareByOrder('tiny', 'large', SIZE_ORDER)).toBeLessThan(0);
    });

    it('should return positive when first value has higher order', () => {
      expect(compareByOrder('huge', 'small', SIZE_ORDER)).toBeGreaterThan(0);
    });

    it('should return zero for equal values', () => {
      expect(compareByOrder('medium', 'medium', SIZE_ORDER)).toBe(0);
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase values', () => {
      expect(compareByOrder('TINY', 'large', SIZE_ORDER)).toBeLessThan(0);
    });

    it('should handle mixed case values', () => {
      expect(compareByOrder('Tiny', 'LARGE', SIZE_ORDER)).toBeLessThan(0);
    });
  });

  describe('unknown values', () => {
    it('should return -1 for values not in order map', () => {
      expect(compareByOrder('unknown', 'tiny', SIZE_ORDER)).toBeLessThan(0);
    });

    it('should handle null values', () => {
      expect(compareByOrder(null, 'tiny', SIZE_ORDER)).toBeLessThan(0);
    });

    it('should handle undefined values', () => {
      expect(compareByOrder(undefined, 'tiny', SIZE_ORDER)).toBeLessThan(0);
    });
  });
});

describe('parseChallengeRating', () => {
  describe('whole numbers', () => {
    it('should parse string integers', () => {
      expect(parseChallengeRating('5')).toBe(5);
    });

    it('should return numeric input unchanged', () => {
      expect(parseChallengeRating(10)).toBe(10);
    });

    it('should parse zero', () => {
      expect(parseChallengeRating('0')).toBe(0);
    });
  });

  describe('fractional CR values', () => {
    it('should parse 1/2 as 0.5', () => {
      expect(parseChallengeRating('1/2')).toBe(0.5);
    });

    it('should parse 1/4 as 0.25', () => {
      expect(parseChallengeRating('1/4')).toBe(0.25);
    });

    it('should parse 1/8 as 0.125', () => {
      expect(parseChallengeRating('1/8')).toBe(0.125);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace around value', () => {
      expect(parseChallengeRating('  5  ')).toBe(5);
    });

    it('should handle whitespace in fraction', () => {
      expect(parseChallengeRating('1 / 2')).toBe(0.5);
    });

    it('should return 0 for invalid input', () => {
      expect(parseChallengeRating('invalid')).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(parseChallengeRating('')).toBe(0);
    });
  });
});

describe('compareChallengeRating', () => {
  describe('basic comparison', () => {
    it('should sort lower CR first', () => {
      expect(compareChallengeRating('1', '5')).toBeLessThan(0);
    });

    it('should sort higher CR last', () => {
      expect(compareChallengeRating('10', '3')).toBeGreaterThan(0);
    });

    it('should return zero for equal CR', () => {
      expect(compareChallengeRating('5', '5')).toBe(0);
    });
  });

  describe('fractional comparison', () => {
    it('should sort 1/8 before 1/4', () => {
      expect(compareChallengeRating('1/8', '1/4')).toBeLessThan(0);
    });

    it('should sort 1/2 before 1', () => {
      expect(compareChallengeRating('1/2', '1')).toBeLessThan(0);
    });

    it('should sort 0 before 1/8', () => {
      expect(compareChallengeRating('0', '1/8')).toBeLessThan(0);
    });
  });

  describe('missing values', () => {
    it('should sort missing values to end (null last)', () => {
      expect(compareChallengeRating('5', null)).toBeLessThan(0);
    });

    it('should sort missing values to end (undefined last)', () => {
      expect(compareChallengeRating('5', undefined)).toBeLessThan(0);
    });

    it('should sort missing first value to end', () => {
      expect(compareChallengeRating(null, '5')).toBeGreaterThan(0);
    });

    it('should return zero when both are missing', () => {
      expect(compareChallengeRating(null, undefined)).toBe(0);
    });
  });
});
