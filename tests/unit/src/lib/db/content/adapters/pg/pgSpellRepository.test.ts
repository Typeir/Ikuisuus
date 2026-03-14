/**
 * pgSpellRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL spell repository.
 * Verifies row-mapping from `SpellEntity` rows (with embedded components
 * and loaded spell lists) to `SpellMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgSpellRepository
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

let pgSpellRepository: typeof import('@/lib/db/content/adapters/pg/pgSpellRepository').pgSpellRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgSpellRepository');
  pgSpellRepository = mod.pgSpellRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM SpellEntity row (matches embedded VO + Collection structure). */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'fireball',
  title: 'Fireball',
  file: 'src/content/en/spells/fireball.mdx',
  link: '/library/spells/fireball',
  level: 3,
  school: 'evocation',
  quality: null,
  castingTimeRaw: '1 action',
  castingTime: ['action'],
  range: '150 feet',
  concentration: false,
  duration: 'Instantaneous',
  components: {
    verbal: true,
    somatic: true,
    material: true,
    materialDescription: 'a tiny ball of bat guano and sulfur',
  },
  hasRitual: false,
  tags: ['damage', 'fire', 'area'],
  spellLists: {
    getItems: () => [
      { name: 'Sorcerer', link: '/library/classes/sorcerer' },
      { name: 'Wizard', link: '/library/classes/wizard' },
    ],
  },
};

describe('pgSpellRepository', () => {
  describe('list', () => {
    it('should map entity rows to SpellMetadata', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgSpellRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'fireball',
        title: 'Fireball',
        level: 3,
        school: 'evocation',
        castingTimeRaw: '1 action',
        castingTime: ['action'],
        range: '150 feet',
        concentration: false,
        duration: 'Instantaneous',
        verbal: true,
        somatic: true,
        material: true,
        materialDescription: 'a tiny ball of bat guano and sulfur',
        hasRitual: false,
        tags: ['damage', 'fire', 'area'],
        spellLists: [
          { name: 'Sorcerer', link: '/library/classes/sorcerer' },
          { name: 'Wizard', link: '/library/classes/wizard' },
        ],
      });
    });

    it('should set spellLists to undefined when the collection is empty', async () => {
      const emptyListsRow = {
        ...entityRow,
        spellLists: { getItems: () => [] },
      };
      mockEM.find.mockResolvedValue([emptyListsRow]);
      const result = await pgSpellRepository.list('en');
      expect(result[0].spellLists).toBeUndefined();
    });

    it('should query with locale filter and title ordering', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgSpellRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { orderBy: { title: 'asc' }, populate: ['spellLists'] },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index projection', async () => {
      mockEM.find.mockResolvedValue([
        { slug: 'fireball', title: 'Fireball', level: 3, school: 'evocation' },
      ]);

      const result = await pgSpellRepository.listIndex('en');

      expect(result).toEqual([
        { slug: 'fireball', title: 'Fireball', level: 3, school: 'evocation' },
      ]);
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('listBySlugs', () => {
    it('should return empty array (stub implementation)', async () => {
      const result = await pgSpellRepository.listBySlugs('en', []);
      expect(result).toEqual([]);
    });

    it('should return empty array regardless of slugs (stub implementation)', async () => {
      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped SpellMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgSpellRepository.getBySlug('en', 'fireball');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('fireball');
      expect(result?.level).toBe(3);
    });

    it('should query by locale and slug', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgSpellRepository.getBySlug('en', 'fireball');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en', slug: 'fireball' },
        { populate: ['spellLists'] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgSpellRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.getBySlug('en', 'fireball');
      expect(result).toBeNull();
    });
  });
});
