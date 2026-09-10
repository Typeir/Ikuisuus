/**
 * @fileoverview reading tests.
 * @module tests/unit/src/lib/constants/reading.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { READING_LINE } from '@/lib/constants/reading';
import { describe, expect, it } from 'vitest';

describe('READING_LINE', () => {
  it('should sit somewhere on the screen', () => {
    expect(READING_LINE).toBeGreaterThan(0);
    expect(READING_LINE).toBeLessThan(1);
  });

  it('should sit at the middle, where the eye goes', () => {
    expect(READING_LINE).toBe(0.5);
  });
});
