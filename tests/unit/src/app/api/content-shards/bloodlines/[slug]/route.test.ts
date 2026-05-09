/**
 * @fileoverview Bloodline Content Shards API Route Unit Tests
 * @description Tests for GET /api/content-shards/bloodlines/[slug].
 *
 * @module tests/unit/app/api/content-shards/bloodlines/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { BloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetFile } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: mockGetFile,
}));

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: {
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
let BloodlineShardsRoute: typeof import('@/app/api/content-shards/bloodlines/[slug]/route');
let bloodlineRepository: BloodlineRepository;

beforeEach(async () => {
  BloodlineShardsRoute =
    await import('@/app/api/content-shards/bloodlines/[slug]/route');
  const repo =
    await import('@/lib/db/content/repositories/bloodlineRepository');
  bloodlineRepository = repo.bloodlineRepository;
  mockGetFile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Sample MDX for the empyrean bloodline using markdown headings. */
const SAMPLE_MDX = `# Empyrean Bloodline

Celestial lineage grants you radiant power.

## Extended Reach

Your unarmed strikes gain +5 ft. reach.

## Featherfall

You fall safely from any height.
`;

/** Minimal mock bloodline metadata. */
const MOCK_META = {
  slug: 'empyrean',
  title: 'Empyrean',
  file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
  link: '/library/character-creation/bloodlines/empyrean',
  coreFeatures: {
    abilityScores: [],
    movementSpeeds: [],
    senses: [],
    size: ['Medium'],
    creatureTypes: ['Humanoid'],
  },
  boonBudget: 10,
  boons: [
    {
      name: 'Extended Reach',
      bpLabel: '3 BP',
      bpValue: 3,
      sortOrder: 0,
      tags: [],
    },
    {
      name: 'Featherfall',
      bpLabel: '2 BP',
      bpValue: 2,
      sortOrder: 1,
      tags: [],
    },
  ],
  tags: [],
};

/**
 * Build a fake Request for the route.
 *
 * @param {string} slug - Bloodline slug
 * @param {Record<string, string | string[]>} [params] - Query params
 * @returns {[Request, { params: Promise<{ slug: string }> }]} Tuple for the route handler
 */
function makeArgs(
  slug: string,
  params: Record<string, string | string[]> = {},
): [Request, { params: Promise<{ slug: string }> }] {
  const url = new URL(`http://localhost/api/content-shards/bloodlines/${slug}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  return [new Request(url.toString()), { params: Promise.resolve({ slug }) }];
}

describe('GET /api/content-shards/bloodlines/[slug]', () => {
  it('returns 404 when the bloodline slug is not found', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(null);

    const res = await BloodlineShardsRoute.GET(...makeArgs('unknown'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 404 when the content file is missing', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue(null);

    const res = await BloodlineShardsRoute.GET(...makeArgs('empyrean'));
    expect(res.status).toBe(404);
  });

  it('returns shardType and all shards when no keys are requested', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'empyrean.bloodline.mdx',
    });

    const res = await BloodlineShardsRoute.GET(...makeArgs('empyrean'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shardType: string;
      shards: Record<string, string>;
    };
    expect(body.shardType).toBe('bloodline');
    expect(body.shards['main']).toBeDefined();
  });

  it('returns only requested keys when keys[] params are provided', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'empyrean.bloodline.mdx',
    });

    const res = await BloodlineShardsRoute.GET(
      ...makeArgs('empyrean', { 'keys[]': 'Extended Reach' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      shards: Record<string, string>;
    };
    expect(body.shards['Extended Reach']).toBeDefined();
    expect(body.shards['main']).toBeUndefined();
  });

  it('defaults locale to en when not provided', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'empyrean.bloodline.mdx',
    });

    await BloodlineShardsRoute.GET(...makeArgs('empyrean'));
    expect(bloodlineRepository.getBySlug).toHaveBeenCalledWith(
      'en',
      'empyrean',
    );
  });

  it('passes locale param to the repository', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockResolvedValue(
      MOCK_META as never,
    );
    mockGetFile.mockResolvedValue({
      content: SAMPLE_MDX,
      resolvedPath: 'empyrean.bloodline.mdx',
    });

    await BloodlineShardsRoute.GET(...makeArgs('empyrean', { locale: 'es' }));
    expect(bloodlineRepository.getBySlug).toHaveBeenCalledWith(
      'es',
      'empyrean',
    );
  });

  it('returns 500 when the repository throws', async () => {
    vi.mocked(bloodlineRepository.getBySlug).mockRejectedValue(
      new Error('DB error'),
    );

    const res = await BloodlineShardsRoute.GET(...makeArgs('empyrean'));
    expect(res.status).toBe(500);
  });
});
