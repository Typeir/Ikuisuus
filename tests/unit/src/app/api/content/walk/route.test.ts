/**
 * @fileoverview Unit tests for the /api/content/walk route handler.
 * @description Verifies that the GET handler returns WalkNode[] for a given
 * locale/path, and returns a 500 on error.
 *
 * @module tests/unit/src/app/api/content/walk/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { GET } from '@/app/api/content/walk/route';
import type { WalkNode } from '@/lib/utils/walk';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRepositoryShallowWalk =
  vi.fn<
    (
      locale: string,
      relativePath?: string,
      maxDepth?: number,
    ) => Promise<WalkNode[]>
  >();

vi.mock('@/lib/utils/repositoryWalk', () => ({
  repositoryShallowWalk: (
    ...args: Parameters<typeof mockRepositoryShallowWalk>
  ) => mockRepositoryShallowWalk(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

/**
 * Builds a mock NextRequest for the walk route.
 *
 * @param {Record<string, string>} params - Query params to include
 * @returns {NextRequest} Mock request
 */
function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/content/walk');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/content/walk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns WalkNode[] from repositoryShallowWalk with maxDepth 2', async () => {
    const nodes: WalkNode[] = [
      {
        name: 'Barbarian',
        path: 'character-creation/vocations/barbarian',
        children: [],
        isStub: true,
      },
    ];
    mockRepositoryShallowWalk.mockResolvedValue(nodes);

    const res = await GET(
      makeRequest({ locale: 'en', path: 'character-creation/vocations' }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(nodes);
    expect(mockRepositoryShallowWalk).toHaveBeenCalledWith(
      'en',
      'character-creation/vocations',
      2,
    );
  });

  it('defaults locale to "en" and path to "" when params are absent', async () => {
    mockRepositoryShallowWalk.mockResolvedValue([]);

    const res = await GET(makeRequest({}));

    expect(res.status).toBe(200);
    expect(mockRepositoryShallowWalk).toHaveBeenCalledWith('en', '', 2);
  });

  it('returns 500 when repositoryShallowWalk throws', async () => {
    mockRepositoryShallowWalk.mockRejectedValue(new Error('fs error'));

    const res = await GET(makeRequest({ locale: 'en', path: 'bad/path' }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
