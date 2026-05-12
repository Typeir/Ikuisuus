/**
 * @fileoverview pgFeatRepository Unit Tests
 * @description Verifies row-mapping from `FeatEntity` rows (with nullable
 * `FeatAbilityIncreaseEmbed`) to `FeatMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgFeatRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEM = {
  find: vi.fn(),
  findOne: vi.fn(),
};

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue(mockEM),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgFeatRepository: typeof import('@/lib/db/content/adapters/pg/pgFeatRepository').pgFeatRepository;

beforeEach(async () => {
  vi.resetModules();
  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));
  const mod = await import('@/lib/db/content/adapters/pg/pgFeatRepository');
  pgFeatRepository = mod.pgFeatRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** Minimal entity row — no ability increase. */
const baseRow = {
  id: 1,
  locale: 'en',
  slug: 'alert',
  title: 'Alert',
  file: 'src/content/en/character-creation/feats/alert.mdx',
  link: '/en/library/character-creation/feats/alert',
  description: null,
  prerequisite: null,
  hasPrerequisite: false,
  abilityIncrease: null,
  tags: ['initiative', 'passive'],
  indexVersion: null,
  versionHash: null,
  features: { isInitialized: () => true, getItems: () => [] },
};

/** Entity row with a full ability increase embed. */
const rowWithAbilityIncrease = {
  ...baseRow,
  slug: 'ability-score-improvement',
  title: 'Ability Score Improvement',
  hasPrerequisite: false,
  abilityIncrease: {
    abilities: ['str', 'dex'],
    amount: 1,
    maximum: 20,
  },
};

/** Entity row with prerequisite text. */
const rowWithPrereq = {
  ...baseRow,
  slug: 'tough',
  title: 'Tough',
  prerequisite: 'Resilient (Constitution)',
  hasPrerequisite: true,
};

describe('pgFeatRepository', () => {
  describe('list', () => {
    it('maps a basic entity row to FeatMetadata', async () => {
      mockEM.find.mockResolvedValue([baseRow]);
      const result = await pgFeatRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'alert',
        title: 'Alert',
        hasPrerequisite: false,
        tags: ['initiative', 'passive'],
      });
      expect(result[0].abilityIncrease).toBeUndefined();
    });

    it('maps the ability increase embed to the domain shape', async () => {
      mockEM.find.mockResolvedValue([rowWithAbilityIncrease]);
      const result = await pgFeatRepository.list('en');

      expect(result[0].abilityIncrease).toEqual({
        abilities: ['str', 'dex'],
        amount: 1,
        maximum: 20,
      });
    });

    it('treats null maximum inside ability increase as undefined', async () => {
      mockEM.find.mockResolvedValue([
        {
          ...rowWithAbilityIncrease,
          abilityIncrease: { abilities: ['con'], amount: 1, maximum: null },
        },
      ]);
      const result = await pgFeatRepository.list('en');
      expect(result[0].abilityIncrease?.maximum).toBeUndefined();
    });

    it('omits abilityIncrease when abilities array is empty', async () => {
      mockEM.find.mockResolvedValue([
        {
          ...baseRow,
          abilityIncrease: { abilities: [], amount: 1, maximum: null },
        },
      ]);
      const result = await pgFeatRepository.list('en');
      expect(result[0].abilityIncrease).toBeUndefined();
    });

    it('maps prerequisite text when present', async () => {
      mockEM.find.mockResolvedValue([rowWithPrereq]);
      const result = await pgFeatRepository.list('en');

      expect(result[0].hasPrerequisite).toBe(true);
      expect(result[0].prerequisite).toBe('Resilient (Constitution)');
    });

    it('queries with locale filter and title ordering', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgFeatRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { orderBy: { title: 'asc' }, populate: ['features'] },
      );
    });

    it('returns empty array on ORM error', async () => {
      mockEM.find.mockRejectedValue(new Error('db down'));
      const result = await pgFeatRepository.list('en');
      expect(result).toEqual([]);
    });

    it('returns empty array when the table has no rows for locale', async () => {
      mockEM.find.mockResolvedValue([]);
      const result = await pgFeatRepository.list('fi');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('returns null when no row is found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgFeatRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('returns the mapped domain object when found', async () => {
      mockEM.findOne.mockResolvedValue(baseRow);
      const result = await pgFeatRepository.getBySlug('en', 'alert');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('alert');
    });

    it('returns null on ORM error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('timeout'));
      const result = await pgFeatRepository.getBySlug('en', 'alert');
      expect(result).toBeNull();
    });

    it('queries with both locale and slug filters', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgFeatRepository.getBySlug('es', 'alert');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'es', slug: 'alert' },
        expect.anything(),
      );
    });
  });
});
