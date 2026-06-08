/**
 * @fileoverview Tests for useSidebarMenu hook
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useSidebarMenu
 */

import { useSidebarMenu } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenu';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('useSidebarMenu', () => {
  it('should return sidebar menu state from context', () => {
    vi.mock('@/lib/context/PersistentUiContext', () => ({
      usePersistentUiState: () => ({
        sidebarMenu: { isOpen: true, expandedPaths: [] },
        isHydrated: true,
      }),
    }));

    const { result } = renderHook(() => useSidebarMenu());
    expect(result.current).toBeDefined();
  });

  it('should include hydration flag in returned state', () => {
    vi.mock('@/lib/context/PersistentUiContext', () => ({
      usePersistentUiState: () => ({
        sidebarMenu: { isOpen: false, expandedPaths: ['test'] },
        isHydrated: true,
      }),
    }));

    const { result } = renderHook(() => useSidebarMenu());
    expect(result.current.isHydrated).toBe(true);
  });

  it('should return expanded paths array from sidebar menu', () => {
    vi.mock('@/lib/context/PersistentUiContext', () => ({
      usePersistentUiState: () => ({
        sidebarMenu: { isOpen: true, expandedPaths: ['path1', 'path2'] },
        isHydrated: false,
      }),
    }));

    const { result } = renderHook(() => useSidebarMenu());
    expect(Array.isArray(result.current.expandedPaths)).toBe(true);
  });
});
