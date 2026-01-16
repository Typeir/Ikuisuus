/**
 * Hooks Index Export Tests
 *
 * @fileoverview Smoke tests to verify hooks index exports correctly.
 */

import {
    useSidebarExpansionActions,
    useSidebarMenuActions,
    useSidebarMenuState,
    useThemeActions,
    useThemeState,
} from '@/lib/hooks';
import { describe, expect, it } from 'vitest';

describe('hooks/index', () => {
  it('should export all sidebar hooks', () => {
    expect(useSidebarMenuState).toBeDefined();
    expect(useSidebarMenuActions).toBeDefined();
    expect(useSidebarExpansionActions).toBeDefined();
  });

  it('should export all theme hooks', () => {
    expect(useThemeState).toBeDefined();
    expect(useThemeActions).toBeDefined();
  });
});
