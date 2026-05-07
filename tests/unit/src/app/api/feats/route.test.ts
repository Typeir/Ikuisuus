/**
 * Feats API Route Unit Tests
 *
 * @fileoverview Tests for the /api/feats endpoint.
 *
 * @module tests/unit/app/api/feats/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { FeatRepository } from '@/lib/db/content/repositories/featRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/featRepository', () => ({
  featRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let FeatsRoute: typeof import('@/app/api/feats/route');
let featRepository: FeatRepository;

beforeEach(async () => {
  FeatsRoute = await import('@/app/api/feats/route');
  const repo = await import('@/lib/db/content/repositories/featRepository');
  featRepository = repo.featRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_FEATS = [
  {
    slug: 'tough',
    title: 'Tough',
    file: 'src/content/en/character-creation/feats/tough.mdx',
    link: '/library/character-creation/feats/tough',
    hasPrerequisite: false,
    tags: [],
  },
];

const makeRequest = (locale?: string): Request => {
  const url = locale
    ? `http://localhost/api/feats?locale=${locale}`
    : 'http://localhost/api/feats';
  return new Request(url);
};

describe('/api/feats route', () => {
  it('exports GET handler', () => {
    expect(FeatsRoute.GET).toBeDefined();
    expect(typeof FeatsRoute.GET).toBe('function');
  });

  it('returns feat data from the repository', async () => {
    vi.mocked(featRepository.list).mockResolvedValue(MOCK_FEATS as never);
    const response = await FeatsRoute.GET(makeRequest());
    const data = await response.json();
    expect(data).toEqual(MOCK_FEATS);
  });

  it('passes locale to repository', async () => {
    vi.mocked(featRepository.list).mockResolvedValue([]);
    await FeatsRoute.GET(makeRequest('es'));
    expect(featRepository.list).toHaveBeenCalledWith('es');
  });

  it('defaults locale to en', async () => {
    vi.mocked(featRepository.list).mockResolvedValue([]);
    await FeatsRoute.GET(makeRequest());
    expect(featRepository.list).toHaveBeenCalledWith('en');
  });

  it('returns 500 on repository error', async () => {
    vi.mocked(featRepository.list).mockRejectedValue(new Error('db error'));
    const response = await FeatsRoute.GET(makeRequest());
    expect(response.status).toBe(500);
  });
});
