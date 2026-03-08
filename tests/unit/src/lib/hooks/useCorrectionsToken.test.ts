/**
 * useCorrectionsToken Hooks Unit Tests
 *
 * @fileoverview Tests for the corrections token state and action hooks.
 *
 * @module tests/unit/lib/hooks/useCorrectionsToken
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockDispatch = vi.fn();
const mockState = {
  correctionsToken: null as string | null,
  isHydrated: true,
};

vi.mock('@/lib/context/PersistentUiContext', () => ({
  usePersistentUiState: () => mockState,
  usePersistentUiDispatch: () => mockDispatch,
}));
vi.mock('@/lib/types/persistentUiState', () => ({
  PERSISTED_UI_ACTION_TYPES: { SET_CORRECTIONS_TOKEN: 'SET_CORRECTIONS_TOKEN' },
}));

import {
    useCorrectionsTokenActions,
    useCorrectionsTokenState,
} from '@/lib/hooks/useCorrectionsToken';

beforeEach(() => {
  vi.clearAllMocks();
  mockState.correctionsToken = null;
  mockState.isHydrated = true;
});

afterEach(() => vi.restoreAllMocks());

describe('useCorrectionsTokenState', () => {
  it('should return null token when none set', () => {
    const { result } = renderHook(() => useCorrectionsTokenState());
    expect(result.current.token).toBeNull();
    expect(result.current.isHydrated).toBe(true);
  });

  it('should return stored token when set', () => {
    mockState.correctionsToken = 'abc123';
    const { result } = renderHook(() => useCorrectionsTokenState());
    expect(result.current.token).toBe('abc123');
  });

  it('should reflect hydration state', () => {
    mockState.isHydrated = false;
    const { result } = renderHook(() => useCorrectionsTokenState());
    expect(result.current.isHydrated).toBe(false);
  });
});

describe('useCorrectionsTokenActions', () => {
  it('should dispatch SET_CORRECTIONS_TOKEN on setToken', () => {
    const { result } = renderHook(() => useCorrectionsTokenActions());

    act(() => {
      result.current.setToken('new-token');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CORRECTIONS_TOKEN',
      payload: { token: 'new-token' },
    });
  });

  it('should dispatch null to clear token', () => {
    const { result } = renderHook(() => useCorrectionsTokenActions());

    act(() => {
      result.current.setToken(null);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CORRECTIONS_TOKEN',
      payload: { token: null },
    });
  });
});
