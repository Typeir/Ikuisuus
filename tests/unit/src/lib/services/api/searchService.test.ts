/**
 * @fileoverview Unit tests for the nearest-route API service helper.
 * @description Uses a mocked fetcher; no network access.
 *
 * @module tests/unit/src/lib/services/api/searchService.test
 */

import { ApiRoutes } from '@/lib/constants/apiRoutes';
import type { RouteMatch } from '@/lib/services/api/searchService';
import { fetchNearestRoute } from '@/lib/services/api/searchService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetcherMock } = vi.hoisted(() => ({
  fetcherMock: vi.fn(),
}));

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: fetcherMock,
}));

const requestInit = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('fetchNearestRoute', () => {
  beforeEach(() => {
    fetcherMock.mockReset();
  });

  it('should post the pathname to the find-nearest-route endpoint', async () => {
    fetcherMock.mockResolvedValue({ match: null });
    await fetchNearestRoute('/en/library/monsters/dragon');
    expect(fetcherMock).toHaveBeenCalledWith(
      ApiRoutes.FindNearestRoute,
      requestInit({ pathname: '/en/library/monsters/dragon' }),
    );
  });

  it('should return the match from the payload', async () => {
    const match: RouteMatch = {
      path: '/en/library/monsters/dragon',
      title: 'Dragon',
      similarity: 0.9,
    };
    fetcherMock.mockResolvedValue({ match });
    await expect(fetchNearestRoute('/en/library/monsters/dragn')).resolves.toBe(
      match,
    );
  });

  it('should return null when no match is found', async () => {
    fetcherMock.mockResolvedValue({ match: null });
    await expect(fetchNearestRoute('/unknown')).resolves.toBeNull();
  });
});
