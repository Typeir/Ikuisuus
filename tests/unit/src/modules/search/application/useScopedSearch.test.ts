/**
 * @fileoverview useScopedSearch Unit Tests
 * @description Tests rank ordering, slug intersection, fallback signaling, and
 * the short-term guard.
 *
 * @module tests/unit/src/modules/search/application/useScopedSearch.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchPagefindMock } = vi.hoisted(() => ({
  searchPagefindMock: vi.fn(),
}));

vi.mock('@/modules/search/infrastructure/pagefindClient', () => ({
  searchPagefind: searchPagefindMock,
}));

import { useScopedSearch } from '@/modules/search/application/useScopedSearch';

/**
 * Builds a Pagefind hit resolving to a fragment with the given slug.
 *
 * @param {string} slug - Record slug carried in meta
 * @returns {{ id: string; data: () => Promise<{ url: string; meta: { slug: string } }> }} Fake hit
 */
function hitOf(slug: string) {
  return {
    id: slug,
    data: () =>
      Promise.resolve({ url: `/library/spells/${slug}`, meta: { slug } }),
  };
}

beforeEach(() => {
  searchPagefindMock.mockReset();
});

describe('useScopedSearch', () => {
  it('reports null ranks for a short term', () => {
    const { result } = renderHook(() =>
      useScopedSearch('a', { locale: 'en', debounceMs: 0 }),
    );

    expect(result.current.ranks).toBeNull();
    expect(searchPagefindMock).not.toHaveBeenCalled();
  });

  it('falls back with null ranks when the index cannot answer', async () => {
    searchPagefindMock.mockResolvedValue(null);
    const { result } = renderHook(() =>
      useScopedSearch('fire', { locale: 'en', debounceMs: 0 }),
    );

    await waitFor(() => expect(searchPagefindMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ranks).toBeNull();
  });

  it('ranks slugs in hit order', async () => {
    searchPagefindMock.mockResolvedValue({
      results: [hitOf('fireball'), hitOf('firebolt'), hitOf('flame-wall')],
    });
    const { result } = renderHook(() =>
      useScopedSearch('fire', { locale: 'en', debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.ranks).not.toBeNull());
    expect([...result.current.ranks!.entries()]).toEqual([
      ['fireball', 0],
      ['firebolt', 1],
      ['flame-wall', 2],
    ]);
  });

  it('keeps only slugs the caller owns', async () => {
    searchPagefindMock.mockResolvedValue({
      results: [hitOf('fireball'), hitOf('unrelated'), hitOf('firebolt')],
    });
    const slugs = new Set(['fireball', 'firebolt']);
    const { result } = renderHook(() =>
      useScopedSearch('fire', { locale: 'en', slugs, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.ranks).not.toBeNull());
    expect([...result.current.ranks!.keys()]).toEqual([
      'fireball',
      'firebolt',
    ]);
  });

  it('passes the type scope to the index query', async () => {
    searchPagefindMock.mockResolvedValue({ results: [] });
    renderHook(() =>
      useScopedSearch('fire', {
        locale: 'en',
        types: ['spells'],
        debounceMs: 0,
      }),
    );

    await waitFor(() =>
      expect(searchPagefindMock).toHaveBeenCalledWith('en', 'fire', {
        filters: { type: ['spells'] },
      }),
    );
  });
});
