/**
 * @fileoverview Tests for domain shared utilities
 * @description Unit tests for generateId, calculateInitiativeMod, and rollInitiative.
 *
 * @module encounter-planner/domain/shared/utils.test
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import {
    calculateInitiativeMod,
    generateId,
    rollInitiative,
} from '@/modules/encounter-planner/domain/shared/utils';
import { describe, expect, it } from 'vitest';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('returns unique IDs on successive calls', () => {
    const ids = Array.from({ length: 20 }, generateId);
    expect(new Set(ids).size).toBe(20);
  });
});

describe('calculateInitiativeMod', () => {
  it('returns 0 for dex 10', () => expect(calculateInitiativeMod(10)).toBe(0));
  it('returns +3 for dex 16', () => expect(calculateInitiativeMod(16)).toBe(3));
  it('returns -1 for dex 8', () => expect(calculateInitiativeMod(8)).toBe(-1));
  it('floors non-integer results', () =>
    expect(calculateInitiativeMod(11)).toBe(0));
});

describe('rollInitiative', () => {
  it('result is within expected range for modifier 0', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollInitiative(0);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });

  it('adds modifier to the roll', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollInitiative(5);
      expect(result).toBeGreaterThanOrEqual(6);
      expect(result).toBeLessThanOrEqual(25);
    }
  });
});
