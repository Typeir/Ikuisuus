/**
 * @fileoverview Browse File API Route Unit Tests
 * @description Tests parameter validation, fuzzy match payload shape,
 * candidate fallback, and the no-content path.
 *
 * @module tests/unit/src/app/api/browse/file/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindNearestFiles, mockFetchContent } = vi.hoisted(() => ({
  mockFindNearestFiles: vi.fn(),
  mockFetchContent: vi.fn(),
}));

vi.mock(
  '@/modules/library/application/use-cases/findNearestRoute',
  () => ({
    findNearestFiles: mockFindNearestFiles,
  }),
);

vi.mock('@/modules/library/infrastructure/content/fetchContent', () => ({
  fetchContent: mockFetchContent,
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

import { GET } from '@/app/api/browse/file/route';

/**
 * Builds a request for the endpoint under test.
 *
 * @param {string} qs - Query string without leading `?`
 * @returns {Request} Request object
 */
function requestOf(qs: string): Request {
  return new Request(`http://localhost/api/browse/file?${qs}`);
}

beforeEach(() => {
  mockFindNearestFiles.mockReset();
  mockFetchContent.mockReset();
});

describe('GET /api/browse/file', () => {
  it('returns 400 without a slug', async () => {
    const res = await GET(requestOf('locale=en'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on an unsupported locale', async () => {
    const res = await GET(requestOf('slug=goblin&locale=../etc'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when nothing matches', async () => {
    mockFindNearestFiles.mockReturnValue([]);
    const res = await GET(requestOf('slug=zzz'));
    expect(res.status).toBe(404);
  });

  it('returns the best match with source and alternates', async () => {
    mockFindNearestFiles.mockReturnValue([
      { path: '/library/monsters/goblin', title: 'Goblin', similarity: 0.9 },
      { path: '/library/monsters/hobgoblin', title: 'Hobgoblin', similarity: 0.6 },
    ]);
    mockFetchContent.mockResolvedValue({
      content: '# Goblin\n',
      resolvedPath: 'monsters/goblin.sheet.mdx',
    });

    const res = await GET(requestOf('slug=gobli&locale=en'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      match: { route: string; slugPath: string; similarity: number };
      alternates: Array<{ route: string }>;
      source: string;
    };
    expect(body.match.route).toBe('/en/library/monsters/goblin');
    expect(body.match.slugPath).toBe('monsters/goblin');
    expect(body.alternates).toHaveLength(1);
    expect(body.source).toContain('# Goblin');
    expect(mockFetchContent).toHaveBeenCalledWith('en', 'monsters/goblin');
  });

  it('falls through to the next candidate when a file does not load', async () => {
    mockFindNearestFiles.mockReturnValue([
      { path: '/library/monsters/ghost', title: 'Ghost', similarity: 0.9 },
      { path: '/library/monsters/ghoul', title: 'Ghoul', similarity: 0.8 },
    ]);
    mockFetchContent
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ content: 'ghoul', resolvedPath: 'x' });

    const res = await GET(requestOf('slug=gho'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { match: { slugPath: string } };
    expect(body.match.slugPath).toBe('monsters/ghoul');
  });

  it('returns 404 when no candidate file loads', async () => {
    mockFindNearestFiles.mockReturnValue([
      { path: '/library/monsters/ghost', title: 'Ghost', similarity: 0.9 },
    ]);
    mockFetchContent.mockResolvedValue(null);

    const res = await GET(requestOf('slug=ghost'));
    expect(res.status).toBe(404);
  });
});
