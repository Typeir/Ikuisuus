import { ApiRoutes } from '@/lib/enums/apiRoutes';
import {
  useActiveDraft,
  useCorrectionsTreeData,
  useNearestRoute,
} from '@/lib/hooks/data/useDraftAndRouteData';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useDraftAndRouteData', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('useActiveDraft should load draft payload by locale and slug', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          draft: {
            id: 1,
            locale: 'en',
            slug: 'monsters/goblin',
            content: '# Goblin',
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
    });

    const { result } = renderHook(() =>
      useActiveDraft('en', 'monsters/goblin'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.draft?.slug).toBe('monsters/goblin');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/drafts?locale=en&slug=monsters%2Fgoblin',
    );
  });

  it('useCorrectionsTreeData should load tree nodes for locale', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          tree: [{ name: 'world', path: 'en/world', type: 'directory' }],
        }),
    });

    const { result } = renderHook(() => useCorrectionsTreeData('en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tree).toEqual([
      { name: 'world', path: 'en/world', type: 'directory' },
    ]);
  });

  it('useNearestRoute should return null and stop loading when pathname is absent', async () => {
    const { result } = renderHook(() => useNearestRoute(null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.nearestRoute).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('useNearestRoute should post pathname and return match payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          match: {
            path: '/en/library/monsters/goblin',
            title: 'Goblin',
            similarity: 0.8,
          },
        }),
    });

    const { result } = renderHook(() =>
      useNearestRoute('/en/library/monsters/gobblin'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(ApiRoutes.FindNearestRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname: '/en/library/monsters/gobblin' }),
    });
    expect(result.current.nearestRoute?.title).toBe('Goblin');
  });
});
