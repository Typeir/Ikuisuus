/**
 * useThemeState Hook Tests
 *
 * @fileoverview Smoke tests asserting the theme state hooks are exported functions.
 */

import { useThemeActions, useThemeState } from '@/lib/hooks/useThemeState';
import { describe, expect, it } from 'vitest';

describe('useThemeState hooks', () => {
  describe('exports', () => {
    it('should export useThemeState', () => {
      expect(useThemeState).toBeDefined();
      expect(typeof useThemeState).toBe('function');
    });

    it('should export useThemeActions', () => {
      expect(useThemeActions).toBeDefined();
      expect(typeof useThemeActions).toBe('function');
    });
  });
});
