import {
  compareByOrder,
  compareChallengeRating,
  parseChallengeRating,
} from '@/modules/metadata-tables/domain/comparators';
import { describe, expect, it } from 'vitest';

describe('comparators', () => {
  it('compares values using explicit order map', () => {
    const order = { low: 1, high: 2 };
    expect(compareByOrder('low', 'high', order)).toBeLessThan(0);
  });

  it('parses numeric and fractional challenge ratings', () => {
    expect(parseChallengeRating('1/2')).toBe(0.5);
    expect(parseChallengeRating('5')).toBe(5);
  });

  it('compares challenge ratings correctly', () => {
    expect(compareChallengeRating('1/2', '1')).toBeLessThan(0);
    expect(compareChallengeRating('2', '1')).toBeGreaterThan(0);
  });
});
