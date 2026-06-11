/**
 * @fileoverview Tests for useSidebarMenu hook
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useSidebarMenu
 */

import { usePersistentUiState } from '@/lib/context/PersistentUiContext';
import { useSidebarMenu } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenu';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/context/PersistentUiContext');

describe('useSidebarMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return sidebar menu state from context', () => {
    vi.mocked(usePersistentUiState).mockReturnValue({
      sidebarMenu: { isOpen: true, expandedPaths: [] },
      isHydrated: true,
    } as any);

    const { result } = renderHook(() => useSidebarMenu());
    expect(result.current).toBeDefined();
  });

  it('should include hydration flag in returned state', () => {
    vi.mocked(usePersistentUiState).mockReturnValue({
      sidebarMenu: { isOpen: false, expandedPaths: ['test'] },
      isHydrated: true,
    } as any);

    const { result } = renderHook(() => useSidebarMenu());
    expect(result.current.isHydrated).toBe(true);
  });

  it('should return expanded paths array from sidebar menu', () => {
    vi.mocked(usePersistentUiState).mockReturnValue({
      sidebarMenu: { isOpen: true, expandedPaths: ['path1', 'path2'] },
      isHydrated: false,
    } as any);

    const { result } = renderHook(() => useSidebarMenu());
    expect(Array.isArray(result.current.expandedPaths)).toBe(true);
  });
});
