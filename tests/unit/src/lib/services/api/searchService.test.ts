import { ApiRoutes } from '@/lib/enums/apiRoutes';
import {
  fetchExternalSearchResults,
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

  it('fetchExternalSearchResults should support direct array payload', async () => {
    const payload = [{ title: 'Result', link: 'https://example.com' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchExternalSearchResults('result');

    expect(mockFetch).toHaveBeenCalledWith('/api/web-search?q=result');
    expect(result).toEqual(payload);
  });

  it('fetchExternalSearchResults should support items payload', async () => {
    const payload = { items: [{ title: 'Item', link: 'https://item.com' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchExternalSearchResults('item');

    expect(result).toEqual(payload.items);
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
