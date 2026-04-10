/**
 * Specializations API Route Unit Tests
 *
 * @fileoverview Tests for the /api/specializations endpoint. Verifies export structure,
 * locale handling, vocation filtering, repository integration, and error resilience.
 *
 * @module tests/unit/app/api/specializations/route
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { SpecializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/specializationRepository', () => ({
  specializationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
    listByVocation: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let SpecializationsRoute: typeof import('@/app/api/specializations/route');
let specializationRepository: SpecializationRepository;

beforeEach(async () => {
  SpecializationsRoute = await import('@/app/api/specializations/route');
  const repo =
    await import('@/lib/db/content/repositories/specializationRepository');
  specializationRepository = repo.specializationRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_SPECIALIZATIONS = [
  {
    slug: 'path-of-the-berserker',
    title: 'Path of the Berserker',
    vocation: 'barbarian',
    specializationType: 'Path',
    features: [{ level: 3, name: 'Frenzy' }],
    tags: [],
  },
];

/**
 * Builds a minimal Request object for the GET handler.
 *
 * @param {Record<string, string>} [params] - Query parameters
 * @returns {Request} Fake request
 */
const makeRequest = (params?: Record<string, string>): Request => {
  const url = new URL('http://localhost/api/specializations');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString());
};

describe('/api/specializations route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(SpecializationsRoute.GET).toBeDefined();
      expect(typeof SpecializationsRoute.GET).toBe('function');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(SpecializationsRoute.GET.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('GET behaviour', () => {
    it('should return specialization data from the repository', async () => {
      vi.mocked(specializationRepository.list).mockResolvedValue(
        MOCK_SPECIALIZATIONS as never,
      );

      const response = await SpecializationsRoute.GET(makeRequest());
      const data = await response.json();
      expect(data).toEqual(MOCK_SPECIALIZATIONS);
    });

    it('should pass locale to repository', async () => {
      vi.mocked(specializationRepository.list).mockResolvedValue([]);

      await SpecializationsRoute.GET(makeRequest({ locale: 'es' }));
      expect(specializationRepository.list).toHaveBeenCalledWith('es');
    });

    it('should default locale to en', async () => {
      vi.mocked(specializationRepository.list).mockResolvedValue([]);

      await SpecializationsRoute.GET(makeRequest());
      expect(specializationRepository.list).toHaveBeenCalledWith('en');
    });

    it('should use listByVocation when vocation param is provided', async () => {
      vi.mocked(specializationRepository.listByVocation).mockResolvedValue(
        MOCK_SPECIALIZATIONS as never,
      );

      const response = await SpecializationsRoute.GET(
        makeRequest({ vocation: 'barbarian' }),
      );
      const data = await response.json();

      expect(specializationRepository.listByVocation).toHaveBeenCalledWith(
        'en',
        'barbarian',
      );
      expect(data).toEqual(MOCK_SPECIALIZATIONS);
    });

    it('should return 500 on repository error', async () => {
      vi.mocked(specializationRepository.list).mockRejectedValue(
        new Error('db error'),
      );

      const response = await SpecializationsRoute.GET(makeRequest());
      expect(response.status).toBe(500);
    });
  });
});
