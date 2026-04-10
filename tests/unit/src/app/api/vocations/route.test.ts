/**
 * Vocations API Route Unit Tests
 *
 * @fileoverview Tests for the /api/vocations endpoint. Verifies export structure,
 * locale handling, repository integration, and error resilience.
 *
 * @module tests/unit/app/api/vocations/route
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { VocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/vocationRepository', () => ({
  vocationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let VocationsRoute: typeof import('@/app/api/vocations/route');
let vocationRepository: VocationRepository;

beforeEach(async () => {
  VocationsRoute = await import('@/app/api/vocations/route');
  const repo = await import('@/lib/db/content/repositories/vocationRepository');
  vocationRepository = repo.vocationRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_VOCATIONS = [
  {
    slug: 'barbarian',
    title: 'Barbarian',
    archetype: 'Martial',
    hitDie: 'd12',
    features: [{ level: 1, name: 'Rage' }],
    tags: ['archetype:martial'],
  },
];

/**
 * Builds a minimal Request object for the GET handler.
 *
 * @param {string} [locale] - Locale query param value
 * @returns {Request} Fake request
 */
const makeRequest = (locale?: string): Request => {
  const url = locale
    ? `http://localhost/api/vocations?locale=${locale}`
    : 'http://localhost/api/vocations';
  return new Request(url);
};

describe('/api/vocations route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(VocationsRoute.GET).toBeDefined();
      expect(typeof VocationsRoute.GET).toBe('function');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(VocationsRoute.GET.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('GET behaviour', () => {
    it('should return vocation data from the repository', async () => {
      vi.mocked(vocationRepository.list).mockResolvedValue(
        MOCK_VOCATIONS as never,
      );

      const response = await VocationsRoute.GET(makeRequest());
      const data = await response.json();
      expect(data).toEqual(MOCK_VOCATIONS);
    });

    it('should pass locale to repository', async () => {
      vi.mocked(vocationRepository.list).mockResolvedValue([]);

      await VocationsRoute.GET(makeRequest('es'));
      expect(vocationRepository.list).toHaveBeenCalledWith('es');
    });

    it('should default locale to en', async () => {
      vi.mocked(vocationRepository.list).mockResolvedValue([]);

      await VocationsRoute.GET(makeRequest());
      expect(vocationRepository.list).toHaveBeenCalledWith('en');
    });

    it('should return 500 on repository error', async () => {
      vi.mocked(vocationRepository.list).mockRejectedValue(
        new Error('db error'),
      );

      const response = await VocationsRoute.GET(makeRequest());
      expect(response.status).toBe(500);
    });
  });
});
