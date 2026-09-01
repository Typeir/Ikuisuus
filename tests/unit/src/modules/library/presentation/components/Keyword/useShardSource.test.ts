/**
 * @fileoverview useShardSource Tests
 * @description Covers the two ways a card finds its prose: from the page that
 * baked it, and from the endpoint when the page did not.
 *
 * @module tests/unit/src/modules/library/presentation/components/Keyword/useShardSource.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react renderHook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useKeywordShard = vi.fn();

vi.mock(
  '@/modules/library/presentation/components/Keyword/KeywordShardContext',
  () => ({
    useKeywordShard: (id?: string) => useKeywordShard(id),
  }),
);

const BAKED = { id: 'kw--resist', heading: 'Resist', source: 'Save.' };
const FETCHED = {
  id: 'kw-condition-blinded',
  heading: 'Blinded',
  source: 'Cannot see.',
  href: 'library/rules/steel-and-strife/conditions#blinded',
};

let useShardSource: typeof import('@/modules/library/presentation/components/Keyword/useShardSource').useShardSource;

beforeEach(async () => {
  vi.resetModules();
  useKeywordShard.mockReset();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => FETCHED }),
  );

  const mod = await import(
    '@/modules/library/presentation/components/Keyword/useShardSource'
  );
  useShardSource = mod.useShardSource;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useShardSource', () => {
  it('should use the shard the page baked without requesting one', () => {
    useKeywordShard.mockReturnValue(BAKED);

    const { result } = renderHook(() =>
      useShardSource('kw--resist', 'resist', 'en'),
    );

    expect(result.current).toBe(BAKED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should request the shard when the page baked none', async () => {
    useKeywordShard.mockReturnValue(null);

    const { result } = renderHook(() =>
      useShardSource(undefined, 'condition;blinded', 'en'),
    );

    await waitFor(() => expect(result.current).toEqual(FETCHED));
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should encode the reference into the request', async () => {
    useKeywordShard.mockReturnValue(null);

    renderHook(() => useShardSource(undefined, 'condition;blinded', 'en'));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      '/api/keyword-shards?ref=condition%3Bblinded&locale=en&keywords=true',
    );
  });

  it('should serve a second card from the first request', async () => {
    useKeywordShard.mockReturnValue(null);

    const first = renderHook(() =>
      useShardSource(undefined, 'condition;blinded', 'en'),
    );
    await waitFor(() => expect(first.result.current).toEqual(FETCHED));

    const second = renderHook(() =>
      useShardSource(undefined, 'condition;blinded', 'en'),
    );
    await waitFor(() => expect(second.result.current).toEqual(FETCHED));

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should stay null when the reference resolves to nothing', async () => {
    useKeywordShard.mockReturnValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'missing',
      }),
    );

    const { result } = renderHook(() =>
      useShardSource(undefined, 'nonexistent', 'en'),
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('should stay null when the request fails', async () => {
    useKeywordShard.mockReturnValue(null);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { result } = renderHook(() =>
      useShardSource(undefined, 'condition;prone', 'en'),
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
