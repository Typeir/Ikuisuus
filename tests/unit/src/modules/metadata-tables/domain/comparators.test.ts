import {
  compareByOrder,
  compareLethality,
  parseLethality,
} from '@/modules/metadata-tables/domain/comparators';
import { describe, expect, it } from 'vitest';

describe('comparators', () => {
  it('compares values using explicit order map', () => {
    const order = { low: 1, high: 2 };
    expect(compareByOrder('low', 'high', order)).toBeLessThan(0);
  });

  it('parses numeric and fractional lethalitys', () => {
    expect(parseLethality('1/2')).toBe(0.5);
    expect(parseLethality('5')).toBe(5);
  });

  it('compares lethalitys correctly', () => {
    expect(compareLethality('1/2', '1')).toBeLessThan(0);
    expect(compareLethality('2', '1')).toBeGreaterThan(0);
  });
});
