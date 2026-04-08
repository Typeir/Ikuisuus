/**
 * Bloodlines API Route Unit Tests
 *
 * @fileoverview Tests for the /api/bloodlines endpoint. Verifies export structure,
 * locale handling, repository integration, and error resilience.
 *
 * @module tests/unit/app/api/bloodlines/route
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/bloodlineRepository', () => ({
  bloodlineRepository: {
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
let BloodlinesRoute: typeof import('@/app/api/bloodlines/route');
let bloodlineRepository: BloodlineRepository;

beforeEach(async () => {
  BloodlinesRoute = await import('@/app/api/bloodlines/route');
  const repo =
    await import('@/lib/db/content/repositories/bloodlineRepository');
  bloodlineRepository = repo.bloodlineRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    file: 'src/content/en/character-creation/bloodlines/empyrean.mdx',
    link: '/library/character-creation/bloodlines/empyrean',
    coreFeatures: {
      abilityScores: ['DEX +2', 'CHA +1'],
      movementSpeeds: ['Walk: 30 ft.'],
      senses: ['Darkvision 30 ft.'],
      size: ['Medium'],
      creatureTypes: ['Humanoid'],
    },
    boonBudget: 10,
    boons: [],
    tags: ['humanoid'],
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
    ? `http://localhost/api/bloodlines?locale=${locale}`
    : 'http://localhost/api/bloodlines';
  return new Request(url);
};

describe('/api/bloodlines route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(BloodlinesRoute.GET).toBeDefined();
      expect(typeof BloodlinesRoute.GET).toBe('function');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(BloodlinesRoute.GET.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('GET behaviour', () => {
    it('should return bloodline data from the repository', async () => {
      vi.mocked(bloodlineRepository.list).mockResolvedValue(
        MOCK_BLOODLINES as never,
      );

      const response = await BloodlinesRoute.GET(makeRequest());
      const data = await response.json();
      expect(data).toEqual(MOCK_BLOODLINES);
    });

    it('should pass locale to repository', async () => {
      vi.mocked(bloodlineRepository.list).mockResolvedValue([]);

      await BloodlinesRoute.GET(makeRequest('es'));
      expect(bloodlineRepository.list).toHaveBeenCalledWith('es');
    });

    it('should default locale to en', async () => {
      vi.mocked(bloodlineRepository.list).mockResolvedValue([]);

      await BloodlinesRoute.GET(makeRequest());
      expect(bloodlineRepository.list).toHaveBeenCalledWith('en');
    });

    it('should return 500 on repository error', async () => {
      vi.mocked(bloodlineRepository.list).mockRejectedValue(
        new Error('db error'),
      );

      const response = await BloodlinesRoute.GET(makeRequest());
      expect(response.status).toBe(500);
    });
  });
});
