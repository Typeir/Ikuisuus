/**
 * Unit tests for the /api/trinkets GET endpoint.
 *
 * @fileoverview Mocks the trinket repository module and verifies exports,
 * locale handling, and error resilience.
 *
 * @module tests/unit/src/app/api/trinkets/route.test
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/trinkets/route Module under test
 * @requires @/lib/db/content/repositories/trinketRepository Repository under mock
 */

import type { TrinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/trinketRepository', () => ({
  trinketRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

/** Imports the route module after the mock is defined. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let TrinketsRoute: typeof import('@/app/api/trinkets/route');
let trinketRepository: TrinketRepository;

beforeEach(async () => {
  TrinketsRoute = await import('@/app/api/trinkets/route');
  const repo = await import('@/lib/db/content/repositories/trinketRepository');
  trinketRepository = repo.trinketRepository;
});

/** Sample trinket metadata used across tests. */
const MOCK_TRINKETS = [
  {
    slug: 'rope-of-climbing',
    name: 'Rope of Climbing',
    type: 'adventuring gear',
    weight: '3 lb',
  },
  {
    slug: 'bag-of-holding',
    name: 'Bag of Holding',
    type: 'wondrous',
    weight: '15 lb',
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
    ? `http://localhost/api/trinkets?locale=${locale}`
    : 'http://localhost/api/trinkets';
  return new Request(url);
};

describe('/api/trinkets route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(TrinketsRoute.GET).toBeDefined();
      expect(typeof TrinketsRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(TrinketsRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(TrinketsRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(TrinketsRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET behaviour', () => {
    it('should return trinket data from the repository', async () => {
      vi.mocked(trinketRepository.list).mockResolvedValue(
        MOCK_TRINKETS as never,
      );

      const response = await TrinketsRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual(MOCK_TRINKETS);
      expect(trinketRepository.list).toHaveBeenCalledWith('en');
    });

    it('should default to locale "en" when no locale param is provided', async () => {
      vi.mocked(trinketRepository.list).mockResolvedValue([]);

      await TrinketsRoute.GET(makeRequest());

      expect(trinketRepository.list).toHaveBeenCalledWith('en');
    });

    it('should pass the requested locale to the repository', async () => {
      vi.mocked(trinketRepository.list).mockResolvedValue([]);

      await TrinketsRoute.GET(makeRequest('es'));

      expect(trinketRepository.list).toHaveBeenCalledWith('es');
    });

    it('should return an empty array when repository returns no data', async () => {
      vi.mocked(trinketRepository.list).mockResolvedValue([]);

      const response = await TrinketsRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual([]);
    });

    it('should return 500 when the repository throws', async () => {
      vi.mocked(trinketRepository.list).mockRejectedValue(
        new Error('disk failure'),
      );

      const response = await TrinketsRoute.GET(makeRequest('en'));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to load trinkets');
    });
  });
});
