/**
 * @fileoverview Tests for useFetchStubChildren hook
 * @module tests/unit/src/lib/components/sidebar/useFetchStubChildren
 */

import { useFetchStubChildren } from '@/lib/components/sidebar/useFetchStubChildren';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useFetchStubChildren', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(false, false, 'test', 'en'),
    );

    expect(result.current.stubChildren).toBeNull();
    expect(result.current.isFetchingChildren).toBe(false);
    expect(result.current.localExpandedHeight).toBeNull();
  });

  it('should not fetch if shouldFetch is false', () => {
    renderHook(() => useFetchStubChildren(false, true, 'test', 'en'));
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('should not fetch if not a stub', () => {
    renderHook(() => useFetchStubChildren(true, false, 'test', 'en'));
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('should construct correct API URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    } as any);

    renderHook(() => useFetchStubChildren(true, true, 'monsters', 'es'));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('locale=es'),
      );
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('path=monsters'),
      );
    });
  });
});
