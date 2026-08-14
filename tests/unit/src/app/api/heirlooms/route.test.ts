/**
 * Heirlooms API Route Unit Tests
 *
 * @fileoverview Tests for the /api/heirlooms endpoint. Verifies export structure,
 * locale handling, repository integration, and error resilience by mocking the
 * heirloom repository module.
 *
 * @module tests/unit/app/api/heirlooms/route
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/heirlooms/route Module under test
 * @requires @/lib/db/content/repositories/heirloomRepository Repository under mock
 */

import type { HeirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/heirloomRepository', () => ({
  heirloomRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

/** Imports the route module after the mock is registered. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let HeirloomsRoute: typeof import('@/app/api/heirlooms/route');
let heirloomRepository: HeirloomRepository;

beforeEach(async () => {
  HeirloomsRoute = await import('@/app/api/heirlooms/route');
  const repo = await import('@/lib/db/content/repositories/heirloomRepository');
  heirloomRepository = repo.heirloomRepository;
});

/** Sample heirloom metadata used across tests. */
const MOCK_HEIRLOOMS = [
  {
    slug: 'flame-tongue',
    name: 'Flame Tongue',
    rarity: 'rare',
    type: 'weapon',
  },
  {
    slug: 'cloak-of-protection',
    name: 'Cloak of Protection',
    rarity: 'uncommon',
    type: 'wondrous',
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
    ? `http://localhost/api/heirlooms?locale=${locale}`
    : 'http://localhost/api/heirlooms';
  return new Request(url);
};

describe('/api/heirlooms route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(HeirloomsRoute.GET).toBeDefined();
      expect(typeof HeirloomsRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(HeirloomsRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(HeirloomsRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(HeirloomsRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET behaviour', () => {
    it('should return heirloom data from the repository', async () => {
      vi.mocked(heirloomRepository.list).mockResolvedValue(
        MOCK_HEIRLOOMS as never,
      );

      const response = await HeirloomsRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual(MOCK_HEIRLOOMS);
      expect(heirloomRepository.list).toHaveBeenCalledWith('en');
    });

    it('should default to locale "en" when no locale param is provided', async () => {
      vi.mocked(heirloomRepository.list).mockResolvedValue([]);

      await HeirloomsRoute.GET(makeRequest());

      expect(heirloomRepository.list).toHaveBeenCalledWith('en');
    });

    it('should pass the requested locale to the repository', async () => {
      vi.mocked(heirloomRepository.list).mockResolvedValue([]);

      await HeirloomsRoute.GET(makeRequest('fi'));

      expect(heirloomRepository.list).toHaveBeenCalledWith('fi');
    });

    it('should return an empty array when repository returns no data', async () => {
      vi.mocked(heirloomRepository.list).mockResolvedValue([]);

      const response = await HeirloomsRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual([]);
    });

    it('should return 500 when the repository throws', async () => {
      vi.mocked(heirloomRepository.list).mockRejectedValue(
        new Error('Connection lost'),
      );

      const response = await HeirloomsRoute.GET(makeRequest('en'));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to load heirlooms');
    });
  });
});
