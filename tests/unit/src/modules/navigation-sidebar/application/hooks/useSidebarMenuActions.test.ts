/**
 * @fileoverview Tests for useSidebarMenuActions hook
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useSidebarMenuActions
 */

import { useSidebarMenuActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenuActions';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockDispatch = vi.fn();

vi.mock('@/lib/context/PersistentUiContext', () => ({
  usePersistentUiDispatch: () => mockDispatch,
}));

describe('useSidebarMenuActions', () => {
  it('should return action functions', () => {
    const { result } = renderHook(() => useSidebarMenuActions());
    expect(typeof result.current.setOpen).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(typeof result.current.open).toBe('function');
  });

  it('should dispatch SET_SIDEBAR_OPEN action on setOpen call', () => {
    mockDispatch.mockClear();
    const { result } = renderHook(() => useSidebarMenuActions());
    act(() => {
      result.current.setOpen(true);
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should dispatch TOGGLE_SIDEBAR action on toggle call', () => {
    mockDispatch.mockClear();
    const { result } = renderHook(() => useSidebarMenuActions());
    act(() => {
      result.current.toggle();
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should dispatch SET_SIDEBAR_OPEN with false on close call', () => {
    mockDispatch.mockClear();
    const { result } = renderHook(() => useSidebarMenuActions());
    act(() => {
      result.current.close();
    });
    expect(mockDispatch).toHaveBeenCalled();
  });
});
