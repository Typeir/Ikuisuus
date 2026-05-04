/**
 * @fileoverview Constants test for sidebar layout
 * @module tests/unit/src/lib/components/sidebar/constants
 */

import {
    BASE_HEIGHT,
    SIDEBAR_CLOSE_ANIMATION_MS,
} from '@/lib/components/sidebar/constants';
import { describe, expect, it } from 'vitest';

describe('Sidebar Constants', () => {
  it('BASE_HEIGHT should be 52 pixels', () => {
    expect(BASE_HEIGHT).toBe(52);
  });

  it('SIDEBAR_CLOSE_ANIMATION_MS should be 500 milliseconds', () => {
    expect(SIDEBAR_CLOSE_ANIMATION_MS).toBe(500);
  });

  it('constants should be positive numbers', () => {
    expect(BASE_HEIGHT).toBeGreaterThan(0);
    expect(SIDEBAR_CLOSE_ANIMATION_MS).toBeGreaterThan(0);
  });
});
