/**
 * pgSpecializationRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL specialization repository.
 * Verifies row-mapping from `SpecializationEntity` rows (with populated features
 * and preparedSpells) to `SpecializationMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgSpecializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
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

let pgSpecializationRepository: typeof import('@/lib/db/content/adapters/pg/pgSpecializationRepository').pgSpecializationRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod =
    await import('@/lib/db/content/adapters/pg/pgSpecializationRepository');
  pgSpecializationRepository = mod.pgSpecializationRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'path-of-the-berserker',
  title: 'Path of the Berserker',
  file: 'src/content/en/character-creation/vocations/barbarian/path-of-the-berserker.mdx',
  link: '/library/character-creation/vocations/barbarian/path-of-the-berserker',
  vocation: 'barbarian',
  specializationType: 'Path',
  flavor: 'A warrior driven by fury.',
  spellcasting: null,
  tags: ['mechanic:melee'],
  indexVersion: 1,
  versionHash: null,
  features: {
    getItems: () => [
      { level: 3, name: 'Frenzy', sortOrder: 0 },
      { level: 6, name: 'Mindless Rage', sortOrder: 1 },
    ],
  },
  preparedSpells: {
    getItems: () => [],
  },
};

const casterEntityRow = {
  ...entityRow,
  slug: 'eldritch-knight',
  title: 'Eldritch Knight',
  vocation: 'fighter',
  specializationType: 'Archetype',
  flavor: null,
  spellcasting: { ability: 'Intelligence', progression: 'Third' },
  features: {
    getItems: () => [{ level: 3, name: 'Spellcasting', sortOrder: 0 }],
  },
  preparedSpells: {
    getItems: () => [
      { level: 3, spells: ['Shield', 'Magic Missile'], sortOrder: 0 },
      { level: 5, spells: ['Misty Step'], sortOrder: 1 },
    ],
  },
};

describe('pgSpecializationRepository', () => {
  describe('list', () => {
    it('should map entity rows to SpecializationMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgSpecializationRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'path-of-the-berserker',
        title: 'Path of the Berserker',
        vocation: 'barbarian',
        specializationType: 'Path',
        tags: ['mechanic:melee'],
      });
    });

    it('should map features in sort order', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgSpecializationRepository.list('en');
      expect(result[0].features).toHaveLength(2);
      expect(result[0].features[0].name).toBe('Frenzy');
      expect(result[0].features[1].name).toBe('Mindless Rage');
    });

    it('should map spellcasting and preparedSpells for caster subclasses', async () => {
      mockEM.find.mockResolvedValue([casterEntityRow]);

      const result = await pgSpecializationRepository.list('en');
      expect(result[0].spellcasting).toEqual({
        ability: 'Intelligence',
        progression: 'Third',
      });
      expect(result[0].spellsAlwaysPrepared).toHaveLength(2);
      expect(result[0].spellsAlwaysPrepared?.[0].spells).toContain('Shield');
    });

    it('should query with locale filter and populate relations', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgSpecializationRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        {
          populate: ['features', 'preparedSpells'],
          orderBy: { title: 'asc' },
        },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgSpecializationRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped SpecializationMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgSpecializationRepository.getBySlug(
        'en',
        'path-of-the-berserker',
      );
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('path-of-the-berserker');
    });

    it('should query by locale and slug with relations populated', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgSpecializationRepository.getBySlug('en', 'path-of-the-berserker');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en', slug: 'path-of-the-berserker' },
        { populate: ['features', 'preparedSpells'] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgSpecializationRepository.getBySlug(
        'en',
        'missing',
      );
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgSpecializationRepository.getBySlug(
        'en',
        'path-of-the-berserker',
      );
      expect(result).toBeNull();
    });
  });

  describe('listByVocation', () => {
    it('should filter by vocation', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgSpecializationRepository.listByVocation(
        'en',
        'barbarian',
      );
      expect(result).toHaveLength(1);
      expect(result[0].vocation).toBe('barbarian');
    });

    it('should query with locale and vocation filter', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgSpecializationRepository.listByVocation('en', 'barbarian');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en', vocation: 'barbarian' },
        {
          populate: ['features', 'preparedSpells'],
          orderBy: { title: 'asc' },
        },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgSpecializationRepository.listByVocation(
        'en',
        'barbarian',
      );
      expect(result).toEqual([]);
    });
  });
});
