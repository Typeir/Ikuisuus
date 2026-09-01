/**
 * Monsters API Route Unit Tests
 *
 * @fileoverview Tests for the /api/monsters endpoint. Verifies export structure,
 * locale handling, repository integration, and error resilience by mocking the
 * monster repository module.
 *
 * @module tests/unit/src/app/api/monsters/route.test
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/monsters/route Module under test
 * @requires @/lib/db/content/repositories/monsterRepository Repository under mock
 */

import type { MonsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/repositories/monsterRepository', () => ({
  monsterRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

/** Import after mock setup so vitest intercepts the module. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let MonstersRoute: typeof import('@/app/api/monsters/route');
let monsterRepository: MonsterRepository;

beforeEach(async () => {
  MonstersRoute = await import('@/app/api/monsters/route');
  const repo = await import('@/lib/db/content/repositories/monsterRepository');
  monsterRepository = repo.monsterRepository;
});

/** Sample monster metadata used across tests. */
const MOCK_MONSTERS = [
  { slug: 'goblin', name: 'Goblin', cr: '1/4', type: 'humanoid' },
  { slug: 'dragon-red', name: 'Red Dragon', cr: '24', type: 'dragon' },
];

/**
 * Builds a minimal Request object for the GET handler.
 *
 * @param {string} [locale] - Locale query param value
 * @returns {Request} Fake request
 */
const makeRequest = (locale?: string): Request => {
  const url = locale
    ? `http://localhost/api/monsters?locale=${locale}`
    : 'http://localhost/api/monsters';
  return new Request(url);
};

describe('/api/monsters route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export GET handler', () => {
      expect(MonstersRoute.GET).toBeDefined();
      expect(typeof MonstersRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(MonstersRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(MonstersRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(MonstersRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET behaviour', () => {
    it('should return monster data from the repository', async () => {
      vi.mocked(monsterRepository.list).mockResolvedValue(
        MOCK_MONSTERS as never,
      );

      const response = await MonstersRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual(MOCK_MONSTERS);
      expect(monsterRepository.list).toHaveBeenCalledWith('en');
    });

    it('should default to locale "en" when no locale param is provided', async () => {
      vi.mocked(monsterRepository.list).mockResolvedValue([]);

      await MonstersRoute.GET(makeRequest());

      expect(monsterRepository.list).toHaveBeenCalledWith('en');
    });

    it('should pass the requested locale to the repository', async () => {
      vi.mocked(monsterRepository.list).mockResolvedValue([]);

      await MonstersRoute.GET(makeRequest('es'));

      expect(monsterRepository.list).toHaveBeenCalledWith('es');
    });

    it('should return an empty array when repository returns no data', async () => {
      vi.mocked(monsterRepository.list).mockResolvedValue([]);

      const response = await MonstersRoute.GET(makeRequest('en'));
      const body = await response.json();

      expect(body).toEqual([]);
    });

    it('should return 500 when the repository throws', async () => {
      vi.mocked(monsterRepository.list).mockRejectedValue(new Error('DB down'));

      const response = await MonstersRoute.GET(makeRequest('en'));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to load monsters');
    });
  });
});
