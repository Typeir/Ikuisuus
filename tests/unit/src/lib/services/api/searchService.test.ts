/**
 * @fileoverview Unit tests for the nearest-route API service helper.
 * @description Uses a mocked JSON client; no network access.
 *
 * @module tests/unit/src/lib/services/api/searchService
 */

import { ApiRoutes } from '@/lib/enums/apiRoutes';
import type { RouteMatch } from '@/lib/services/api/searchService';
import { fetchNearestRoute } from '@/lib/services/api/searchService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postJsonMock } = vi.hoisted(() => ({
  postJsonMock: vi.fn(),
}));

vi.mock('@/lib/services/api/jsonClient', () => ({
  postJson: postJsonMock,
}));

describe('fetchNearestRoute', () => {
  beforeEach(() => {
    postJsonMock.mockReset();
  });

  it('should post the pathname to the find-nearest-route endpoint', async () => {
    postJsonMock.mockResolvedValue({ match: null });
    await fetchNearestRoute('/en/library/monsters/dragon');
    expect(postJsonMock).toHaveBeenCalledWith(ApiRoutes.FindNearestRoute, {
      pathname: '/en/library/monsters/dragon',
    });
  });

  it('should return the match from the payload', async () => {
    const match: RouteMatch = {
      path: '/en/library/monsters/dragon',
      title: 'Dragon',
      similarity: 0.9,
    };
    postJsonMock.mockResolvedValue({ match });
    await expect(fetchNearestRoute('/en/library/monsters/dragn')).resolves.toBe(
      match,
    );
  });

  it('should return null when no match is found', async () => {
    postJsonMock.mockResolvedValue({ match: null });
    await expect(fetchNearestRoute('/unknown')).resolves.toBeNull();
  });
});
