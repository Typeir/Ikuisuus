/**
 * @fileoverview Gate-coverage unit test for useNearestRoute hook.
 * @module tests/unit/src/modules/library/application/hooks/useNearestRoute
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import {
    type NearestRouteState,
    useNearestRoute,
} from '@/modules/library/application/hooks/useNearestRoute';
import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('swr', () => ({
  default: vi.fn(),
}));

const mockedUseSWR = vi.mocked(useSWR);

describe('useNearestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns route data from SWR', () => {
    mockedUseSWR.mockReturnValue({
      data: {
        path: '/en/library/spells/main',
        title: 'Spells',
        similarity: 0.9,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useNearestRoute('/en/library/spels/main'),
    );

    expect(result.current.nearestRoute?.path).toBe('/en/library/spells/main');
    expect(result.current.loading).toBe(false);
  });

  it('returns null route while loading', () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useNearestRoute('/en/library/wrld/main'),
    );
    const state: NearestRouteState = result.current;

    expect(state.nearestRoute).toBeNull();
    expect(state.loading).toBe(true);
  });
});
