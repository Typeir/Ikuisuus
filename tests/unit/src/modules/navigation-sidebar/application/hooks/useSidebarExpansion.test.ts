/**
 * @fileoverview Tests for useSidebarExpansion hook
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useSidebarExpansion.test
 */

import { useSidebarExpansion } from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockDispatch = vi.fn();

vi.mock('@/lib/context/PersistentUiContext', () => ({
  usePersistentUiDispatch: () => mockDispatch,
  usePersistentUiState: () => ({
    sidebarMenu: { isOpen: true, expandedPaths: [] },
    isHydrated: true,
  }),
}));

describe('useSidebarExpansion', () => {
  it('should return expansion action functions', () => {
    const { result } = renderHook(() => useSidebarExpansion());
    expect(typeof result.current.setExpanded).toBe('function');
    expect(typeof result.current.togglePath).toBe('function');
    expect(typeof result.current.isExpanded).toBe('function');
  });

  it('should dispatch SET_SIDEBAR_EXPANSION action on setExpanded call', () => {
    mockDispatch.mockClear();
    const { result } = renderHook(() => useSidebarExpansion());
    act(() => {
      result.current.setExpanded('test-path', true);
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should dispatch TOGGLE_SIDEBAR_PATH action on togglePath call', () => {
    mockDispatch.mockClear();
    const { result } = renderHook(() => useSidebarExpansion());
    act(() => {
      result.current.togglePath('test-path');
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should check if path is expanded', () => {
    const { result } = renderHook(() => useSidebarExpansion());
    expect(result.current.isExpanded('expanded-path')).toBe(false);
    expect(result.current.isExpanded('non-expanded-path')).toBe(false);
  });
});
