/**
 * @fileoverview Browse Search API Route Unit Tests
 * @description Tests parameter validation, fuzzy ranking with substring
 * priority, type filtering, and the limit cap.
 *
 * @module tests/unit/src/app/api/browse/search/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
}));

vi.mock('@/lib/db/content/repositories/byContentType', () => {
  const repo = { list: listMock };
  return {
    REPOSITORIES_BY_TYPE: {
      bloodlines: repo,
      feats: repo,
      heirlooms: repo,
      monsters: repo,
      rules: repo,
      specializations: repo,
      spells: repo,
      trinkets: repo,
      vocations: repo,
      world: repo,
    },
  };
});

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

import { GET } from '@/app/api/browse/search/route';

/**
 * Builds a request for the endpoint under test.
 *
 * @param {string} qs - Query string without leading `?`
 * @returns {Request} Request object
 */
function requestOf(qs: string): Request {
  return new Request(`http://localhost/api/browse/search?${qs}`);
}

/**
 * Builds one metadata record fixture.
 *
 * @param {string} slug - Record slug
 * @param {string} title - Record title
 * @returns {{ slug: string; title: string; link: string; description: string }} Record
 */
function recordOf(slug: string, title: string) {
  return {
    slug,
    title,
    link: `/library/spells/${slug}`,
    description: `${title} description`,
  };
}

beforeEach(() => {
  listMock.mockReset().mockResolvedValue([]);
});

describe('GET /api/browse/search', () => {
  it('returns 400 without a query', async () => {
    const res = await GET(requestOf('locale=en'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on an unsupported locale', async () => {
    const res = await GET(requestOf('q=fire&locale=xx'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on an unknown type', async () => {
    const res = await GET(requestOf('q=fire&type=potions'));
    expect(res.status).toBe(400);
  });

  it('ranks substring hits above edit-distance matches', async () => {
    listMock.mockResolvedValue([
      recordOf('fireball', 'Fireball'),
      recordOf('firebolt', 'Firebolt'),
      recordOf('wall-of-stone', 'Wall of Stone'),
    ]);

    const res = await GET(requestOf('q=fireball&type=spells&locale=en'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      results: Array<{ slug: string; score: number; link: string }>;
    };
    expect(body.results[0].slug).toBe('fireball');
    expect(body.results[0].score).toBeGreaterThanOrEqual(0.9);
    expect(body.results[0].link).toBe('/en/library/spells/fireball');
    expect(
      body.results.find((r) => r.slug === 'wall-of-stone'),
    ).toBeUndefined();
  });

  it('queries only the requested type', async () => {
    listMock.mockResolvedValue([recordOf('fireball', 'Fireball')]);

    await GET(requestOf('q=fire&type=spells'));
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('caps results at the limit', async () => {
    listMock.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) =>
        recordOf(`fire-${i}`, `Fire ${i}`),
      ),
    );

    const res = await GET(requestOf('q=fire&type=spells&limit=3'));
    const body = (await res.json()) as {
      total: number;
      results: unknown[];
    };
    expect(body.results).toHaveLength(3);
    expect(body.total).toBe(10);
  });
});
