/**
 * @fileoverview Dice Utils Unit Tests
 * @description Tests for the shared rollDie utility.
 *
 * @module tests/unit/src/lib/utils/diceUtils.test
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { rollDie } from '@/lib/utils/diceUtils';
import { describe, expect, it, vi } from 'vitest';

describe('rollDie', () => {
  it('returns 1 for a d1 (faces = 1)', () => {
    expect(rollDie(1)).toBe(1);
  });

  it('returns a value in range [1, faces] for d6', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollDie(6)).toBe(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(rollDie(6)).toBe(6);
    vi.restoreAllMocks();
  });

  it('returns a value in range [1, faces] for d20', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollDie(20)).toBe(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(rollDie(20)).toBe(20);
    vi.restoreAllMocks();
  });

  it('returns 1 for faces = 0 (guard)', () => {
    expect(rollDie(0)).toBe(1);
  });

  it('returns 1 for negative faces (guard)', () => {
    expect(rollDie(-6)).toBe(1);
  });

  it('returns 1 for NaN (guard)', () => {
    expect(rollDie(NaN)).toBe(1);
  });

  it('returns 1 for Infinity (guard)', () => {
    expect(rollDie(Infinity)).toBe(1);
  });
});
