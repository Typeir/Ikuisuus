/**
 * Spells API Route Unit Tests
 *
 * @fileoverview Tests for the /api/spells endpoint. Verifies export structure,
 * locale handling, slug filtering, repository integration, and error resilience
 * by mocking the spell repository module.
 *
 * @module tests/unit/app/api/spells/route
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/spells/route Module under test
 * @requires @/lib/db/content/repositories/spellRepository Repository under mock
 */

import type { SpellRepository } from '@/lib/db/content/repositories/spellRepository';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Sample spell metadata used across tests. */
const MOCK_SPELLS = [
  { slug: 'fireball', name: 'Fireball', level: 3, school: 'evocation' },
  { slug: 'shield', name: 'Shield', level: 1, school: 'abjuration' },
  { slug: 'wish', name: 'Wish', level: 9, school: 'conjuration' },
];

vi.mock('@/lib/db/content/repositories/spellRepository', () => ({
  spellRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    listBySlugs: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

/** Import after mock setup so vitest intercepts the module. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let SpellsRoute: typeof import('@/app/api/spells/route');
let spellRepository: SpellRepository;

beforeEach(async () => {
  SpellsRoute = await import('@/app/api/spells/route');
  const repo = await import('@/lib/db/content/repositories/spellRepository');
  spellRepository = repo.spellRepository;
});

/**
 * Builds a minimal POST Request object for the spells handler.
 *
 * @param {object} [body] - JSON body
 * @returns {Request} Fake request
 */
const makeRequest = (body: Record<string, unknown> = {}): Request =>
  new Request('http://localhost/api/spells', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/spells route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export POST handler', () => {
      expect(SpellsRoute.POST).toBeDefined();
      expect(typeof SpellsRoute.POST).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(SpellsRoute);
      expect(exports).toContain('POST');
    });
  });

  describe('POST handler signature', () => {
    it('should be an async function', () => {
      expect(SpellsRoute.POST.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(SpellsRoute.POST.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST behaviour', () => {
    it('should return all spells when no slug filter is provided', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue(MOCK_SPELLS as never);

      const response = await SpellsRoute.POST(makeRequest({ locale: 'en' }));
      const body = await response.json();

      expect(body).toEqual(MOCK_SPELLS);
      expect(spellRepository.list).toHaveBeenCalledWith('en');
    });

    it('should filter spells by slug when spells array is provided', async () => {
      vi.mocked(spellRepository.listBySlugs).mockImplementation(
        async (_locale: string, slugs: string[]) => {
          return MOCK_SPELLS.filter((s) => slugs.includes(s.slug)) as never;
        },
      );

      const response = await SpellsRoute.POST(
        makeRequest({ locale: 'en', spells: ['fireball'] }),
      );
      const body = await response.json();

      expect(body).toEqual([MOCK_SPELLS[0]]);
      expect(spellRepository.listBySlugs).toHaveBeenCalledWith('en', [
        'fireball',
      ]);
    });

    it('should default to locale "en" when no locale is provided', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue(MOCK_SPELLS as never);

      await SpellsRoute.POST(makeRequest({}));

      expect(spellRepository.list).toHaveBeenCalledWith('en');
    });

    it('should pass the requested locale to the repository', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue([]);

      await SpellsRoute.POST(makeRequest({ locale: 'fi' }));

      expect(spellRepository.list).toHaveBeenCalledWith('fi');
    });

    it('should return an empty array when repository returns no data', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue([]);

      const response = await SpellsRoute.POST(makeRequest({ locale: 'en' }));
      const body = await response.json();

      expect(body).toEqual([]);
    });

    it('should return 500 when the repository throws', async () => {
      vi.mocked(spellRepository.list).mockRejectedValue(new Error('timeout'));

      const response = await SpellsRoute.POST(makeRequest({ locale: 'en' }));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to load spells');
    });
  });
});
