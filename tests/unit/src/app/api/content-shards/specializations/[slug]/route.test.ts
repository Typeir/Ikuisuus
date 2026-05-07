/**
 * @fileoverview Specialization Content Shards API Route Unit Tests
 * @description Tests for GET /api/content-shards/specializations/[slug].
 *
 * @module tests/unit/app/api/content-shards/specializations/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { SpecializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetFile } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: mockGetFile,
}));

vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn() }),
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let SpecializationShardsRoute: typeof import('@/app/api/content-shards/specializations/[slug]/route');
let specializationRepository: SpecializationRepository;

beforeEach(async () => {
  SpecializationShardsRoute = await import(
    '@/app/api/content-shards/specializations/[slug]/route'
  );
  const repo = await import(
    '@/lib/db/content/repositories/specializationRepository'
  );
  specializationRepository = repo.specializationRepository;
  mockGetFile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Sample MDX for a specialization. */
const SAMPLE_MDX = `# Path of the Berserker

The most primal of all berserker paths.

## Frenzy

While raging you can enter a frenzy, making an extra attack.

## Mindless Rage

You cannot be charmed or frightened while raging.
`;

/** Minimal mock specialization metadata. */
const MOCK_META = {
  slug: 'path-of-the-berserker',
  title: 'Path of the Berserker',
  file: 'character-creation/vocations/barbarian/path-of-the-berserker.mdx',
  link: '/library/character-creation/vocations/barbarian/path-of-the-berserker',
  vocation: 'barbarian',
  specializationType: 'Path',
  features: [
    { level: 3, name: 'Frenzy' },
    { level: 6, name: 'Mindless Rage' },
  ],
  tags: [],
};

/**
 * Build a fake Request for the route.
 *
 * @param {string} slug - Specialization slug
 * @param {Record<string, string | string[]>} [params] - Query params
 * @returns {[Request, { params: Promise<{ slug: string }> }]} Tuple for the route handler
 */
function makeArgs(
  slug: string,
  params: Record<string, string | string[]> = {},
): [Request, { params: Promise<{ slug: string }> }] {
  const url = new URL(
    `http://localhost/api/content-shards/specializations/${slug}`,
  );
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  return [new Request(url.toString()), { params: Promise.resolve({ slug }) }];
}

describe('GET /api/content-shards/specializations/[slug]', () => {
  it('returns 404 when the specialization slug is not found', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(null);

    const res = await SpecializationShardsRoute.GET(...makeArgs('unknown'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 404 when the content file is missing', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue(null);

    const res = await SpecializationShardsRoute.GET(
      ...makeArgs('path-of-the-berserker'),
    );
    expect(res.status).toBe(404);
  });

  it('returns shardType and all shards when no keys are requested', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({ content: SAMPLE_MDX, resolvedPath: 'path-of-the-berserker.mdx' });

    const res = await SpecializationShardsRoute.GET(
      ...makeArgs('path-of-the-berserker'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: Record<string, string>;
    };
    expect(body.shardType).toBe('specialization');
    expect(body.shards['main']).toBeDefined();
    expect(body.shards['Frenzy']).toBeDefined();
    expect(body.shards['Mindless Rage']).toBeDefined();
  });

  it('returns only requested keys when keys[] params are provided', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({ content: SAMPLE_MDX, resolvedPath: 'path-of-the-berserker.mdx' });

    const res = await SpecializationShardsRoute.GET(
      ...makeArgs('path-of-the-berserker', { 'keys[]': 'Frenzy' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { shards: Record<string, string> };
    expect(body.shards['Frenzy']).toContain('extra attack');
    expect(body.shards['Mindless Rage']).toBeUndefined();
  });

  it('defaults locale to en when not provided', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({ content: SAMPLE_MDX, resolvedPath: 'path-of-the-berserker.mdx' });

    await SpecializationShardsRoute.GET(...makeArgs('path-of-the-berserker'));
    expect(specializationRepository.getBySlug).toHaveBeenCalledWith(
      'en',
      'path-of-the-berserker',
    );
  });

  it('passes locale param to the repository', async () => {
    vi.mocked(specializationRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({ content: SAMPLE_MDX, resolvedPath: 'path-of-the-berserker.mdx' });

    await SpecializationShardsRoute.GET(
      ...makeArgs('path-of-the-berserker', { locale: 'es' }),
    );
    expect(specializationRepository.getBySlug).toHaveBeenCalledWith(
      'es',
      'path-of-the-berserker',
    );
  });

  it('returns 500 when the repository throws', async () => {
    vi.mocked(specializationRepository.getBySlug).mockRejectedValue(
      new Error('DB error'),
    );

    const res = await SpecializationShardsRoute.GET(
      ...makeArgs('path-of-the-berserker'),
    );
    expect(res.status).toBe(500);
  });
});
