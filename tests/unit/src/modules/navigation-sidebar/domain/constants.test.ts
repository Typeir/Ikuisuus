/**
 * @fileoverview Unit tests for domain/constants
 * @module tests/unit/src/modules/navigation-sidebar/domain/constants
 */

import {
    BASE_HEIGHT,
    SHALLOW_WALK_DEPTH,
    SIDEBAR_CLOSE_ANIMATION_MS,
    VIRTUALIZATION_THRESHOLD,
} from '@/modules/navigation-sidebar/domain/constants';
import { describe, expect, it } from 'vitest';

describe('navigation-sidebar constants', () => {
  it('should export BASE_HEIGHT as 52', () => {
    expect(BASE_HEIGHT).toBe(52);
  });

  it('should export SIDEBAR_CLOSE_ANIMATION_MS as 500', () => {
    expect(SIDEBAR_CLOSE_ANIMATION_MS).toBe(500);
  });

  it('should export VIRTUALIZATION_THRESHOLD as 50', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBe(50);
  });

  it('should export SHALLOW_WALK_DEPTH as 2', () => {
    expect(SHALLOW_WALK_DEPTH).toBe(2);
  });

  it('should have reasonable numeric values', () => {
    expect(BASE_HEIGHT).toBeGreaterThan(0);
    expect(SIDEBAR_CLOSE_ANIMATION_MS).toBeGreaterThan(0);
    expect(VIRTUALIZATION_THRESHOLD).toBeGreaterThan(0);
    expect(SHALLOW_WALK_DEPTH).toBeGreaterThan(0);
  });
});
