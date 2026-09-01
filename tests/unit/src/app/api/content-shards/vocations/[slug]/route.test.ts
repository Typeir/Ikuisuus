/**
 * @fileoverview Vocation Content Shards API Route Unit Tests
 * @description Tests for GET /api/content-shards/vocations/[slug].
 *
 * @module tests/unit/src/app/api/content-shards/vocations/[slug]/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { VocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetFile } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: mockGetFile,
}));

vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn() }),
  },
}));

vi.mock('@/app/api/content-shards/keywordShards', () => ({
  keywordShardsFor: vi.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let VocationShardsRoute: typeof import('@/app/api/content-shards/vocations/[slug]/route');
let vocationRepository: VocationRepository;

beforeEach(async () => {
  VocationShardsRoute =
    await import('@/app/api/content-shards/vocations/[slug]/route');
  const repo = await import('@/lib/db/content/repositories/vocationRepository');
  vocationRepository = repo.vocationRepository;
  mockGetFile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Sample MDX for the Berserker vocation. */
const SAMPLE_MDX = `# Berserker

A fierce warrior of the wilderness.

## Rage

While raging you gain bonus damage and resistance.

## Unarmored Defense

When not wearing armor your AC equals 10 + DEX + CON.
`;

/** Minimal mock vocation metadata. */
const MOCK_META = {
  slug: 'Berserker',
  title: 'Berserker',
  file: 'character-creation/vocations/Berserker.mdx',
  link: '/library/character-creation/vocations/Berserker',
  archetype: 'Martial',
  primaryAbility: ['Strength'],
  hitDie: 'd12',
  savingThrows: ['Strength', 'Constitution'],
  armorProficiencies: [],
  weaponProficiencies: [],
  toolProficiencies: [],
  skillProficiencies: { count: 2, choices: [] },
  specializations: [],
  features: [
    { level: 1, name: 'Rage' },
    { level: 1, name: 'Unarmored Defense' },
  ],
  tags: [],
};

/**
 * Build a fake Request for the route.
 *
 * @param {string} slug - Vocation slug
 * @param {Record<string, string | string[]>} [params] - Query params
 * @returns {[Request, { params: Promise<{ slug: string }> }]} Tuple for the route handler
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

describe('GET /api/content-shards/vocations/[slug]', () => {
  it('returns 404 when the vocation slug is not found', async () => {
    vi.mocked(vocationRepository.getBySlug).mockResolvedValue(null);

    const res = await VocationShardsRoute.GET(...makeArgs('unknown'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 404 when the content file is missing', async () => {
    vi.mocked(vocationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue(null);

    const res = await VocationShardsRoute.GET(...makeArgs('Berserker'));
    expect(res.status).toBe(404);
  });

  it('returns shardType and all shards when no keys are requested', async () => {
    vi.mocked(vocationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'Berserker.mdx',
    });

    const res = await VocationShardsRoute.GET(...makeArgs('Berserker'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: Record<string, string>;
    };
    expect(body.shardType).toBe('vocation');
    expect(body.shards['main']).toBeDefined();
    expect(body.shards['Rage']).toBeDefined();
    expect(body.shards['Unarmored Defense']).toBeDefined();
  });

  it('returns only requested keys when keys[] params are provided', async () => {
    vi.mocked(vocationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'Berserker.mdx',
    });

    const res = await VocationShardsRoute.GET(
      ...makeArgs('Berserker', { 'keys[]': 'Rage' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { shards: Record<string, string> };
    expect(body.shards['Rage']).toContain('bonus damage');
    expect(body.shards['Unarmored Defense']).toBeUndefined();
  });

  it('defaults locale to en when not provided', async () => {
    vi.mocked(vocationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'Berserker.mdx',
    });

    await VocationShardsRoute.GET(...makeArgs('Berserker'));
    expect(vocationRepository.getBySlug).toHaveBeenCalledWith(
      'en',
      'Berserker',
    );
  });

  it('rejects an unsupported locale before the repository', async () => {
    vi.mocked(vocationRepository.getBySlug).mockClear();
    const res = await VocationShardsRoute.GET(
      ...makeArgs('Berserker', { locale: 'es' }),
    );
    expect(res.status).toBe(400);
    expect(vocationRepository.getBySlug).not.toHaveBeenCalled();
  });

  it('returns 500 when the repository throws', async () => {
    vi.mocked(vocationRepository.getBySlug).mockRejectedValue(
      new Error('DB error'),
    );

    const res = await VocationShardsRoute.GET(...makeArgs('Berserker'));
    expect(res.status).toBe(500);
  });
});
