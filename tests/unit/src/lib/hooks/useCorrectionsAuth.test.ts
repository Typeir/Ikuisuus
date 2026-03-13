/**
 * useCorrectionsAuth Hook Unit Tests
 *
 * @fileoverview Tests for the corrections auth hook.
 *
 * @module tests/unit/lib/hooks/useCorrectionsAuth
 */

import { act, renderHook, waitFor } from '@testing-library/react';
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { useCorrectionsAuth } from '@/lib/hooks/useCorrectionsAuth';

beforeEach(() => {
  vi.clearAllMocks();
  mockState.correctionsToken = null;
  mockState.isHydrated = true;
});

afterEach(() => vi.restoreAllMocks());

describe('useCorrectionsAuth', () => {
  it('should return initial state when not logged in', () => {
    const { result } = renderHook(() => useCorrectionsAuth());
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isLoggingIn).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should login successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'session-abc',
        user: { id: '1', username: 'editor', role: 'editor' },
      }),
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.login('editor', 'password');
    });

    expect(success).toBe(true);
    expect(result.current.user?.username).toBe('editor');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_CORRECTIONS_TOKEN',
        payload: { token: 'session-abc' },
      }),
    );
  });

  it('should set error on failed login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.login('wrong', 'wrong');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should clear error on clearError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'oops' }),
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    await act(async () => {
      await result.current.login('x', 'y');
    });
    expect(result.current.error).toBe('oops');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('should logout and clear state', async () => {
    const { result } = renderHook(() => useCorrectionsAuth());

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_CORRECTIONS_TOKEN',
        payload: { token: null },
      }),
    );
  });

  it('should validate stored token on hydration', async () => {
    mockState.correctionsToken = 'stored-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        session: { userId: '1', username: 'editor', role: 'editor' },
      }),
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    await waitFor(() => {
      expect(result.current.user?.username).toBe('editor');
    });
  });

  it('should clear stale token on validation failure', async () => {
    mockState.correctionsToken = 'expired-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: false }),
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_CORRECTIONS_TOKEN',
          payload: { token: null },
        }),
      );
    });
  });
});
