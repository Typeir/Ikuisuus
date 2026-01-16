/**
 * useThemeState Hook Tests
 *
 * @fileoverview Smoke tests for theme state hooks. Full integration testing
 * is covered in PersistentUiContext.test.tsx since these hooks consume the context.
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
