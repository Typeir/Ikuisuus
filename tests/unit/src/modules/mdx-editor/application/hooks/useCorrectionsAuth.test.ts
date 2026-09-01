/**
 * useCorrectionsAuth Hook Unit Tests
 *
 * @fileoverview Tests for the corrections auth hook.
 *
 * @module tests/unit/src/modules/mdx-editor/application/hooks/useCorrectionsAuth.test
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

const { mockFetcher } = vi.hoisted(() => ({
  mockFetcher: vi.fn(),
}));

vi.mock('@/lib/fetch/fetcher', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/fetch/fetcher')>(
      '@/lib/fetch/fetcher',
    );
  return {
    fetcher: mockFetcher,
    FetchError: actual.FetchError,
  };
});

import { FetchError } from '@/lib/fetch/fetcher';
import { useCorrectionsAuth } from '@/modules/mdx-editor/application/hooks/useCorrectionsAuth';

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
    mockFetcher.mockResolvedValueOnce({
      token: 'session-abc',
      user: { id: '1', username: 'editor', role: 'editor' },
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
    mockFetcher.mockRejectedValueOnce(
      new FetchError(
        401,
        'Unauthorized',
        { error: 'Invalid credentials' },
        '/api/auth/login',
      ),
    );

    const { result } = renderHook(() => useCorrectionsAuth());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.login('wrong', 'wrong');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should clear error on clearError', async () => {
    mockFetcher.mockRejectedValueOnce(
      new FetchError(
        500,
        'Internal Server Error',
        { error: 'oops' },
        '/api/auth/login',
      ),
    );

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

    mockFetcher.mockResolvedValueOnce({
      valid: true,
      session: { userId: '1', username: 'editor', role: 'editor' },
    });

    const { result } = renderHook(() => useCorrectionsAuth());

    await waitFor(() => {
      expect(result.current.user?.username).toBe('editor');
    });
  });

  it('should clear stale token on validation failure', async () => {
    mockState.correctionsToken = 'expired-token';

    mockFetcher.mockResolvedValueOnce({ valid: false });

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
