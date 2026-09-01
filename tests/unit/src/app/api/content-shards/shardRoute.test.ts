/**
 * @fileoverview Content Shard Route Factory Unit Tests
 * @description Tests the shared GET handler: 404 paths, payload shape,
 * undefined entries, and the 500 failure path.
 *
 * @module tests/unit/src/app/api/content-shards/shardRoute.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockGetFile, mockKeywordShardsFor } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
  mockKeywordShardsFor: vi.fn(),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: mockGetFile,
}));

vi.mock('@/app/api/content-shards/keywordShards', () => ({
  keywordShardsFor: mockKeywordShardsFor,
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn() }),
  },
}));

import { shardRouteFor } from '@/app/api/content-shards/shardRoute';

/** Sample MDX with one feature heading. */
const SAMPLE_MDX = `# Page

Intro prose.

## Rage

Rage prose.
`;

/** Metadata record every test resolves. */
const META = {
  file: 'character-creation/vocations/berserker.mdx',
  features: [{ name: 'Rage' }],
};

/**
 * Builds a handler under test with overridable config.
 *
 * @param {Partial<Parameters<typeof shardRouteFor>[0]>} [overrides] - Config overrides
 * @returns {ReturnType<typeof shardRouteFor>} Handler built from the merged config
 */
function handlerOf(
  overrides: Partial<Parameters<typeof shardRouteFor<typeof META>>[0]> = {},
): ReturnType<typeof shardRouteFor<typeof META>> {
  return shardRouteFor<typeof META>({
    label: 'Vocation',
    shardType: 'vocation',
    getMeta: vi.fn().mockResolvedValue(META),
    entriesOf: (meta) => meta.features,
    ...overrides,
  });
}

/**
 * Builds handler args for a slug and query params.
 *
 * @param {string} slug - Route slug
 * @param {Record<string, string | string[]>} [params] - Query params
 * @returns {[Request, { params: Promise<{ slug: string }> }]} Handler argument tuple
 */
function makeArgs(
  slug: string,
  params: Record<string, string | string[]> = {},
): [Request, { params: Promise<{ slug: string }> }] {
  const url = new URL(`http://localhost/api/content-shards/vocations/${slug}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  return [new Request(url.toString()), { params: Promise.resolve({ slug }) }];
}

describe('shardRouteFor', () => {
  afterEach(() => {
    mockGetFile.mockReset();
    mockKeywordShardsFor.mockReset();
  });

  it('returns a labeled 404 when metadata is missing', async () => {
    const GET = handlerOf({ getMeta: vi.fn().mockResolvedValue(null) });

    const res = await GET(...makeArgs('unknown'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Vocation not found: unknown');
  });

  it('returns 404 when the content file is missing', async () => {
    mockGetFile.mockResolvedValue(null);
    const GET = handlerOf();

    const res = await GET(...makeArgs('berserker'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/content file not found for vocation/i);
  });

  it('resolves shards and keyword shards into the payload', async () => {
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'berserker.mdx',
    });
    mockKeywordShardsFor.mockResolvedValue([
      { id: 'kw--rage', heading: 'Rage', source: 'Rage prose.', href: 'library/x#rage' },
    ]);
    const GET = handlerOf();

    const res = await GET(...makeArgs('berserker', { locale: 'en' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: Record<string, string>;
      keywordShards: Array<{ id: string }>;
    };
    expect(body.shardType).toBe('vocation');
    expect(body.shards['Rage']).toContain('Rage prose');
    expect(body.keywordShards[0].id).toBe('kw--rage');
    expect(mockKeywordShardsFor).toHaveBeenCalledWith(body.shards, 'en');
  });

  it('returns 400 on an unsupported locale', async () => {
    const getMeta = vi.fn();
    const GET = handlerOf({ getMeta });

    const res = await GET(...makeArgs('berserker', { locale: '../en' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unsupported locale: ../en');
    expect(getMeta).not.toHaveBeenCalled();
  });

  it('treats undefined entries as an empty list', async () => {
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'berserker.mdx',
    });
    mockKeywordShardsFor.mockResolvedValue([]);
    const GET = handlerOf({ entriesOf: () => undefined });

    const res = await GET(...makeArgs('berserker'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { shards: Record<string, string> };
    expect(body.shards['main']).toBeDefined();
  });

  it('returns 500 when the lookup throws', async () => {
    const GET = handlerOf({
      getMeta: vi.fn().mockRejectedValue(new Error('DB error')),
    });

    const res = await GET(...makeArgs('berserker'));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Failed to resolve vocation shards');
  });
});
