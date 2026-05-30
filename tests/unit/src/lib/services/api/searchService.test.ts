import { ApiRoutes } from '@/lib/enums/apiRoutes';
import {
    fetchLibrarySearchResults,
    fetchNearestRoute,
} from '@/lib/services/api/searchService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('searchService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchLibrarySearchResults should URL-encode query', async () => {
    const payload = [{ name: 'Goblin', path: 'monsters/goblin' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchLibrarySearchResults('spell slots & magic');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search?q=spell%20slots%20%26%20magic',
    );
    expect(result).toEqual(payload);
  });

  it('fetchNearestRoute should POST pathname to nearest-route API', async () => {
    const payload = {
      match: {
        path: '/en/library/monsters/goblin',
        title: 'Goblin',
        similarity: 0.8,
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchNearestRoute('/en/library/monsters/gobblin');

    expect(mockFetch).toHaveBeenCalledWith(ApiRoutes.FindNearestRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname: '/en/library/monsters/gobblin' }),
    });
    expect(result).toEqual(payload.match);
  });
});
