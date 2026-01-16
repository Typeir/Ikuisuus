/**
 * rangeWrap Utility Unit Tests
 * 
 * @fileoverview Tests for the rangeWrap utility function that wraps values
 * within a range indefinitely using modulo arithmetic.
 */

import { describe, it, expect } from 'vitest';
import { rangeWrap } from '@/lib/utils/rangeWrap';

describe('rangeWrap', () => {
  it('should return value when within range', () => {
    expect(rangeWrap(5, 0, 10)).toBe(5);
    expect(rangeWrap(0, 0, 10)).toBe(0);
    expect(rangeWrap(10, 0, 10)).toBe(10);
  });

  it('should wrap value above max using modulo', () => {
    expect(rangeWrap(11, 0, 10)).toBe(0);  // 11 % 11 = 0
    expect(rangeWrap(12, 0, 10)).toBe(1);  // 12 % 11 = 1
    expect(rangeWrap(21, 0, 10)).toBe(10); // 21 % 11 = 10
  });

  it('should wrap value below min using modulo', () => {
    expect(rangeWrap(-1, 0, 10)).toBe(10);  // -1 % 11 = 10
    expect(rangeWrap(-2, 0, 10)).toBe(9);   // -2 % 11 = 9
    expect(rangeWrap(-11, 0, 10)).toBe(0);  // -11 % 11 = 0
  });

  it('should handle non-zero min values', () => {
    expect(rangeWrap(15, 5, 10)).toBe(9);   // Range [5,10] = 6 values, 15-5=10, 10%6=4, 4+5=9
    expect(rangeWrap(4, 5, 10)).toBe(10);   // 4-5=-1, -1%6=5, 5+5=10
    expect(rangeWrap(7, 5, 10)).toBe(7);    // Within range
  });

  it('should handle negative ranges', () => {
    expect(rangeWrap(1, -5, 5)).toBe(1);    // Within range
    expect(rangeWrap(6, -5, 5)).toBe(-5);   // 6-(-5)=11, 11%11=0, 0+(-5)=-5
    expect(rangeWrap(-6, -5, 5)).toBe(5);   // -6-(-5)=-1, -1%11=10, 10+(-5)=5
  });

  it('should handle single value range', () => {
    expect(rangeWrap(5, 5, 5)).toBe(5);     // Range size 1, always returns 5
    expect(rangeWrap(10, 5, 5)).toBe(5);
  });

  it('should handle decimal values', () => {
    expect(rangeWrap(5.5, 0, 10)).toBe(5.5);    // Within range
    expect(rangeWrap(10.5, 0, 10)).toBe(10.5);  // 10.5 is within [0, 10] if inclusive
    expect(rangeWrap(-0.5, 0, 10)).toBe(10.5);  // -0.5 wraps to 10.5
  });

  it('should work with theme cycling (0-2 range)', () => {
    // Simulating theme cycling: dark (0), light (1), auto (2)
    expect(rangeWrap(0, 0, 2)).toBe(0);
    expect(rangeWrap(1, 0, 2)).toBe(1);
    expect(rangeWrap(2, 0, 2)).toBe(2);
    expect(rangeWrap(3, 0, 2)).toBe(0);  // 3 % 3 = 0
    expect(rangeWrap(-1, 0, 2)).toBe(2); // -1 % 3 = 2
    expect(rangeWrap(7, 0, 2)).toBe(1);  // 7 % 3 = 1 (user's example!)
  });

  it('should handle large wrap-around values', () => {
    expect(rangeWrap(100, 0, 10)).toBe(1);  // 100 % 11 = 1
    expect(rangeWrap(-100, 0, 10)).toBe(10); // -100 % 11 = -1, wrapped to 10
  });
});
