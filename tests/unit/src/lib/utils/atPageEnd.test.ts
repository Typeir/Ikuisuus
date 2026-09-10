/**
 * @fileoverview atPageEnd tests.
 * @module tests/unit/src/lib/utils/atPageEnd.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { atPageEnd } from '@/lib/utils/atPageEnd';
import { describe, expect, it } from 'vitest';

describe('atPageEnd', () => {
  it('should say no at the top of a long page', () => {
    expect(atPageEnd(0, 800, 4000)).toBe(false);
  });

  it('should say no partway down it', () => {
    expect(atPageEnd(1600, 800, 4000)).toBe(false);
  });

  it('should say yes once the last of it is on the screen', () => {
    expect(atPageEnd(3200, 800, 4000)).toBe(true);
  });

  it('should say yes a pixel short, where zoom leaves the scroll', () => {
    expect(atPageEnd(3199, 800, 4000)).toBe(true);
  });

  it('should say no two pixels short of that', () => {
    expect(atPageEnd(3197, 800, 4000)).toBe(false);
  });

  it('should say yes for a page that fits the screen', () => {
    expect(atPageEnd(0, 800, 800)).toBe(true);
    expect(atPageEnd(0, 800, 500)).toBe(true);
  });

  it('should say yes past the end, where a bounce takes it', () => {
    expect(atPageEnd(5000, 800, 4000)).toBe(true);
  });

  it('should take a slack of its own', () => {
    expect(atPageEnd(3100, 800, 4000, 200)).toBe(true);
    expect(atPageEnd(3100, 800, 4000, 50)).toBe(false);
  });

  it('should say no about a page it has no measure of', () => {
    expect(atPageEnd(0, 800, 0)).toBe(false);
    expect(atPageEnd(0, 800, -100)).toBe(false);
  });

  it('should say no for numbers that are not numbers', () => {
    expect(atPageEnd(Number.NaN, 800, 4000)).toBe(false);
    expect(atPageEnd(0, Number.POSITIVE_INFINITY, 4000)).toBe(false);
    expect(atPageEnd(0, 800, Number.NaN)).toBe(false);
  });
});
