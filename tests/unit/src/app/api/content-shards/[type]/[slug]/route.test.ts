/**
 * @fileoverview Content Shard Route Unit Tests
 * @description Tests the unified GET handler: locale and type validation, 404
 * paths, the resolved envelope for repository and keyword addresses, key
 * subsetting, and the 500 failure path.
 *
 * @module tests/unit/src/app/api/content-shards/[type]/[slug]/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockGetFile, mockGetBySlug, mockListLinks } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
  mockGetBySlug: vi.fn(),
  mockListLinks: vi.fn(),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: mockGetFile,
}));

vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: { getBySlug: mockGetBySlug },
}));

vi.mock('@/lib/db/content/repositories/featRepository', () => ({
  featRepository: { getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: { getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: { getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/repositories/keywordLinkRepository', () => ({
  keywordLinkRepository: { listLinks: mockListLinks },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), warning: vi.fn(), debug: vi.fn() }),
  },
}));

import { GET } from '@/app/api/content-shards/[type]/[slug]/route';
import { clearKeywordGraphCache } from '@/lib/db/content/keywordGraph';

/** Sample MDX with two feature headings. */
const SAMPLE_MDX = `# Berserker

A fierce warrior.

## Rage

While raging you gain bonus damage.

## Unarmored Defense

Your AC equals 10 + DEX + CON.
`;

/** Prose defining a keyword, referenced from the sample below. */
const RULES_MDX = `# Effects

## Resist

Halve the damage.
`;

/** Metadata record the vocation lookup resolves. */
const META = {
  file: 'character-creation/vocations/Berserker.mdx',
  link: '/library/character-creation/vocations/Berserker',
  features: [{ name: 'Rage' }, { name: 'Unarmored Defense' }],
};

/**
 * Builds handler args for an address and query params.
 *
 * @param {string} type - Route type segment
 * @param {string} slug - Address segment, already decoded
 * @param {Record<string, string | string[]>} [params] - Query params
 * @returns {[Request, { params: Promise<{ type: string; slug: string }> }]} Handler argument tuple
 */
function makeArgs(
  type: string,
  slug: string,
  params: Record<string, string | string[]> = {},
): [Request, { params: Promise<{ type: string; slug: string }> }] {
  const url = new URL(
    `http://localhost/api/content-shards/${type}/${encodeURIComponent(slug)}`,
  );
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  return [
    new Request(url.toString()),
    { params: Promise.resolve({ type, slug }) },
  ];
}

describe('GET /api/content-shards/[type]/[slug]', () => {
  afterEach(() => {
    mockGetFile.mockReset();
    mockGetBySlug.mockReset();
    mockListLinks.mockReset().mockResolvedValue([]);
    clearKeywordGraphCache();
  });

  it('rejects an unsupported locale before locating', async () => {
    const res = await GET(...makeArgs('vocations', 'Berserker', { locale: 'es' }));
    expect(res.status).toBe(400);
    expect(mockGetBySlug).not.toHaveBeenCalled();
  });

  it('returns 404 for an unregistered type', async () => {
    const res = await GET(...makeArgs('sandwiches', 'blt'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unknown shard type: sandwiches');
  });

  it('returns a labeled 404 when the address is unknown', async () => {
    mockGetBySlug.mockResolvedValue(null);
    const res = await GET(...makeArgs('vocations', 'unknown'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Vocation not found: unknown');
  });

  it('returns 404 when the content file is missing', async () => {
    mockGetBySlug.mockResolvedValue(META);
    mockGetFile.mockResolvedValue(null);
    const res = await GET(...makeArgs('vocations', 'Berserker'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/content file not found for vocation/i);
  });

  it('resolves the full envelope for a repository address', async () => {
    mockGetBySlug.mockResolvedValue(META);
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'Berserker.mdx',
    });

    const res = await GET(...makeArgs('vocations', 'Berserker'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: { id: string; key: string; heading: string; source: string; href: string }[];
      keywordShards: unknown[];
      resolutions: Record<string, unknown>;
    };
    expect(body.shardType).toBe('vocation');
    expect(body.shards.map((s) => s.key)).toEqual([
      'main',
      'Rage',
      'Unarmored Defense',
    ]);
    const rage = body.shards.find((s) => s.key === 'Rage');
    expect(rage).toMatchObject({
      id: 'rage',
      heading: 'Rage',
      href: 'library/character-creation/vocations/Berserker#rage',
    });
    expect(rage?.source).toContain('bonus damage');
    expect(body.keywordShards).toEqual([]);
    expect(body.resolutions).toEqual({});
  });

  it('resolves only the requested keys', async () => {
    mockGetBySlug.mockResolvedValue(META);
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'Berserker.mdx',
    });

    const res = await GET(
      ...makeArgs('vocations', 'Berserker', { 'keys[]': 'Rage' }),
    );
    const body = (await res.json()) as { shards: { key: string }[] };
    expect(body.shards.map((s) => s.key)).toEqual(['Rage']);
  });

  it('resolves a keyword address through the producer graph', async () => {
    mockListLinks.mockResolvedValue([
      {
        file: 'rules/effects.rule.mdx',
        link: '/library/rules/effects',
        produces: ['kw--resist'],
        consumes: [],
      },
    ]);
    mockGetFile.mockResolvedValue({
      content: RULES_MDX,
      resolvedPath: 'effects.rule.mdx',
    });

    const res = await GET(...makeArgs('keyword', 'resist'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: { id: string; key: string; heading: string; href: string }[];
    };
    expect(body.shardType).toBe('keyword');
    expect(body.shards).toHaveLength(1);
    expect(body.shards[0]).toMatchObject({
      id: 'kw--resist',
      key: 'resist',
      heading: 'Resist',
      href: 'library/rules/effects#resist',
    });
  });

  it('returns 404 when a keyword resolves to nothing', async () => {
    mockListLinks.mockResolvedValue([]);
    const res = await GET(...makeArgs('keyword', 'unheard-of'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Keyword not found: unheard-of');
  });

  it('returns 500 when the lookup throws', async () => {
    mockGetBySlug.mockRejectedValue(new Error('DB error'));
    const res = await GET(...makeArgs('vocations', 'Berserker'));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Failed to resolve vocation shards');
  });
});
