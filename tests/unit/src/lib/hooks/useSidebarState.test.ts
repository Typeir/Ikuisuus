/**
 * useSidebarState Hook Tests
 *
 * @fileoverview Smoke tests for sidebar state hooks. Full integration testing
 * is covered in PersistentUiContext.test.tsx since these hooks consume the context.
 */

import {
    useSidebarExpansionActions,
    useSidebarMenuActions,
    useSidebarMenuState,
} from '@/lib/hooks/useSidebarState';
import { describe, expect, it } from 'vitest';

describe('useSidebarState hooks', () => {
  describe('exports', () => {
    it('should export useSidebarMenuState', () => {
      expect(useSidebarMenuState).toBeDefined();
      expect(typeof useSidebarMenuState).toBe('function');
    });

    it('should export useSidebarMenuActions', () => {
      expect(useSidebarMenuActions).toBeDefined();
      expect(typeof useSidebarMenuActions).toBe('function');
    });

    it('should export useSidebarExpansionActions', () => {
      expect(useSidebarExpansionActions).toBeDefined();
      expect(typeof useSidebarExpansionActions).toBe('function');
    });
  });
});
