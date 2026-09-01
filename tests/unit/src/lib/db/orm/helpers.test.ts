/**
 * Row Mapping Utilities Unit Tests
 *
 * @fileoverview Tests for the orUndef, nonEmpty, and formatDate helper functions.
 *
 * @module tests/unit/src/lib/db/orm/helpers.test
 */

import { formatDate, nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { describe, expect, it } from 'vitest';

describe('orUndef', () => {
  it('should return undefined for null', () => {
    expect(orUndef(null)).toBeUndefined();
  });

  it('should return undefined for undefined', () => {
    expect(orUndef(undefined)).toBeUndefined();
  });

  it('should return the value when present', () => {
    expect(orUndef('hello')).toBe('hello');
  });

  it('should return 0 without converting to undefined', () => {
    expect(orUndef(0)).toBe(0);
  });

  it('should return empty string without converting to undefined', () => {
    expect(orUndef('')).toBe('');
  });

  it('should return false without converting to undefined', () => {
    expect(orUndef(false)).toBe(false);
  });
});

describe('nonEmpty', () => {
  it('should return undefined for an empty array', () => {
    expect(nonEmpty([])).toBeUndefined();
  });

  it('should return the array when it has entries', () => {
    const arr = ['fire', 'cold'];
    expect(nonEmpty(arr)).toBe(arr);
  });

  it('should return a single-element array', () => {
    const arr = [42];
    expect(nonEmpty(arr)).toBe(arr);
  });
});

describe('formatDate', () => {
  it('should return undefined for null', () => {
    expect(formatDate(null)).toBeUndefined();
  });

  it('should return undefined for undefined', () => {
    expect(formatDate(undefined)).toBeUndefined();
  });

  it('should return ISO string for a Date', () => {
    const d = new Date('2025-01-15T12:00:00Z');
    expect(formatDate(d)).toBe(d.toISOString());
  });

  it('should coerce non-Date truthy values to string', () => {
    const result = formatDate('2025-01-15' as unknown as Date);
    expect(result).toBe('2025-01-15');
  });
});
