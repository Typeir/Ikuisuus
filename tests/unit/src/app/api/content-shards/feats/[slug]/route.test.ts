/**
 * Feat Content Shards Route Unit Tests
 *
 * @fileoverview Tests for /api/content-shards/feats/[slug].
 *
 * @module tests/unit/app/api/content-shards/feats/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/featRepository', () => ({
  featRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: vi.fn(),
}));

vi.mock('@/lib/utils/contentShardResolver', () => ({
  resolveShards: vi.fn(),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let route: typeof import('@/app/api/content-shards/feats/[slug]/route');
let featRepository: typeof import('@/lib/db/content/repositories/featRepository').featRepository;
let getFile: ReturnType<typeof vi.fn>;
let resolveShards: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  route = await import('@/app/api/content-shards/feats/[slug]/route');
  const repo = await import('@/lib/db/content/repositories/featRepository');
  featRepository = repo.featRepository;
  const fts = await import('@/lib/db/content/fileTreeService');
  getFile = fts.getFile as ReturnType<typeof vi.fn>;
  const csr = await import('@/lib/utils/contentShardResolver');
  resolveShards = csr.resolveShards as ReturnType<typeof vi.fn>;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const META = {
  slug: 'tough',
  title: 'Tough',
  file: 'src/content/en/character-creation/feats/tough.mdx',
  link: '/library/character-creation/feats/tough',
  hasPrerequisite: false,
  tags: [],
};

const makeContext = (slug: string) => ({
  params: Promise.resolve({ slug }),
});

describe('/api/content-shards/feats/[slug]', () => {
  it('returns shards for an existing feat', async () => {
    vi.mocked(featRepository.getBySlug).mockResolvedValue(META as never);
    getFile.mockResolvedValue({ content: '# Tough\n\nBody', path: META.file });
    resolveShards.mockReturnValue({ main: 'Body' });

    const response = await route.GET(
      new Request('http://localhost/api/content-shards/feats/tough'),
      makeContext('tough'),
    );
    const data = await response.json();
    expect(data).toEqual({ shardType: 'feat', shards: { main: 'Body' } });
  });

  it('returns 404 when the feat is missing', async () => {
    vi.mocked(featRepository.getBySlug).mockResolvedValue(null);
    const response = await route.GET(
      new Request('http://localhost/api/content-shards/feats/nope'),
      makeContext('nope'),
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when the content file is missing', async () => {
    vi.mocked(featRepository.getBySlug).mockResolvedValue(META as never);
    getFile.mockResolvedValue(null);
    const response = await route.GET(
      new Request('http://localhost/api/content-shards/feats/tough'),
      makeContext('tough'),
    );
    expect(response.status).toBe(404);
  });

  it('returns 500 on resolver error', async () => {
    vi.mocked(featRepository.getBySlug).mockResolvedValue(META as never);
    getFile.mockResolvedValue({ content: 'x', path: META.file });
    resolveShards.mockImplementation(() => {
      throw new Error('boom');
    });
    const response = await route.GET(
      new Request('http://localhost/api/content-shards/feats/tough'),
      makeContext('tough'),
    );
    expect(response.status).toBe(500);
  });
});
