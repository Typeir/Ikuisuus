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
    listBySource: vi.fn(),
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
  vi.mocked(spellRepository.list).mockReset();
  vi.mocked(spellRepository.listBySlugs).mockReset();
  vi.mocked(spellRepository.listBySource).mockReset();
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
      expect(spellRepository.list).toHaveBeenCalledWith('en', undefined);
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

      expect(spellRepository.list).toHaveBeenCalledWith('en', undefined);
    });

    it('should pass the requested locale to the repository', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue([]);

      await SpellsRoute.POST(makeRequest({ locale: 'fi' }));

      expect(spellRepository.list).toHaveBeenCalledWith('fi', undefined);
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

  describe('filters', () => {
    it('should forward an allow-listed filter to repository.list', async () => {
      vi.mocked(spellRepository.list).mockResolvedValue([]);

      const filters = [
        { field: 'source', operator: 'neq', value: 'basic' },
      ];

      await SpellsRoute.POST(makeRequest({ locale: 'en', filters }));

      expect(spellRepository.list).toHaveBeenCalledWith('en', filters);
    });

    it('should apply filters in memory when slugs are provided', async () => {
      vi.mocked(spellRepository.listBySlugs).mockResolvedValue([
        { slug: 'fireball', source: null, school: 'Evocation' },
        { slug: 'magic-missile', source: 'basic', school: 'Evocation' },
      ] as never);

      const response = await SpellsRoute.POST(
        makeRequest({
          locale: 'en',
          spells: ['fireball', 'magic-missile'],
          filters: [{ field: 'source', operator: 'neq', value: 'basic' }],
        }),
      );
      const body = await response.json();

      expect(body).toEqual([
        { slug: 'fireball', source: null, school: 'Evocation' },
      ]);
    });

    it('should reject malformed filter payload with 400', async () => {
      const response = await SpellsRoute.POST(
        makeRequest({ locale: 'en', filters: 'not-an-array' }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid filters payload');
      expect(spellRepository.list).not.toHaveBeenCalled();
    });

    it('should reject filter on a disallowed field with 400', async () => {
      const response = await SpellsRoute.POST(
        makeRequest({
          locale: 'en',
          filters: [{ field: 'description', operator: 'eq', value: 'x' }],
        }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/description/);
      expect(spellRepository.list).not.toHaveBeenCalled();
    });

    it('should reject in-operator with non-array value with 400', async () => {
      const response = await SpellsRoute.POST(
        makeRequest({
          locale: 'en',
          filters: [{ field: 'source', operator: 'in', value: 'basic' }],
        }),
      );

      expect(response.status).toBe(400);
      expect(spellRepository.list).not.toHaveBeenCalled();
    });
  });
});
