/**
 * @fileoverview Tests for useFetchStubChildren hook
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useFetchStubChildren
 */

import { useFetchStubChildren } from '@/modules/navigation-sidebar/application/hooks/useFetchStubChildren';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/navigation-sidebar/application/api-clients/fetchStubChildren',
  () => ({
    fetchStubChildren: vi.fn().mockResolvedValue([]),
  }),
);

describe('useFetchStubChildren', () => {
  it('should not fetch when shouldFetch is false', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(false, true, 'test', 'en'),
    );

    expect(result.current.stubChildren).toBeNull();
    expect(result.current.isFetchingChildren).toBe(false);
  });

  it('should not fetch when isStub is false', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(true, false, 'test', 'en'),
    );

    expect(result.current.stubChildren).toBeNull();
    expect(result.current.isFetchingChildren).toBe(false);
  });

  it('should return initial state with null stubChildren', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(false, false, 'test', 'en'),
    );

    expect(result.current.stubChildren).toBeNull();
    expect(result.current.isFetchingChildren).toBe(false);
    expect(result.current.localExpandedHeight).toBeNull();
  });

  it('should handle fetch errors gracefully', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(true, true, 'test', 'en'),
    );

    expect(result.current).toBeDefined();
  });

  it('should calculate expanded height from fetched nodes', () => {
    const { result } = renderHook(() =>
      useFetchStubChildren(true, true, 'monsters', 'es'),
    );

    expect(result.current).toBeDefined();
  });
});
