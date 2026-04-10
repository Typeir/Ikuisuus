/**
 * pgVocationRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL vocation repository.
 * Verifies row-mapping from `VocationEntity` rows (with populated features)
 * to `VocationMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgVocationRepository
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

let pgVocationRepository: typeof import('@/lib/db/content/adapters/pg/pgVocationRepository').pgVocationRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgVocationRepository');
  pgVocationRepository = mod.pgVocationRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'barbarian',
  title: 'Barbarian',
  file: 'src/content/en/character-creation/vocations/barbarian/main.mdx',
  link: '/library/character-creation/vocations/barbarian',
  archetype: 'Martial',
  primaryAbility: ['Strength'],
  hitDie: 'd12',
  savingThrows: ['Strength', 'Constitution'],
  armorProficiencies: ['Light armor', 'Medium armor', 'Shields'],
  weaponProficiencies: ['Simple weapons', 'Martial weapons'],
  toolProficiencies: [],
  skillProficiencies: {
    count: 2,
    choices: ['Athletics', 'Intimidation', 'Survival'],
  },
  spellcasting: null,
  specializations: ['path-of-the-berserker'],
  tags: ['archetype:martial'],
  indexVersion: 1,
  versionHash: null,
  features: {
    getItems: () => [
      { level: 1, name: 'Rage', sortOrder: 0 },
      { level: 2, name: 'Reckless Attack', sortOrder: 1 },
    ],
  },
};

const casterEntityRow = {
  ...entityRow,
  slug: 'cleric',
  title: 'Cleric',
  archetype: 'Full Caster',
  hitDie: 'd8',
  spellcasting: { ability: 'Wisdom', progression: 'Full' },
  features: {
    getItems: () => [{ level: 1, name: 'Spellcasting', sortOrder: 0 }],
  },
};

describe('pgVocationRepository', () => {
  describe('list', () => {
    it('should map entity rows to VocationMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgVocationRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'barbarian',
        title: 'Barbarian',
        archetype: 'Martial',
        hitDie: 'd12',
        tags: ['archetype:martial'],
      });
    });

    it('should map features in sort order', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgVocationRepository.list('en');
      expect(result[0].features).toHaveLength(2);
      expect(result[0].features[0].name).toBe('Rage');
      expect(result[0].features[1].name).toBe('Reckless Attack');
    });

    it('should map spellcasting for caster vocations', async () => {
      mockEM.find.mockResolvedValue([casterEntityRow]);

      const result = await pgVocationRepository.list('en');
      expect(result[0].spellcasting).toEqual({
        ability: 'Wisdom',
        progression: 'Full',
      });
    });

    it('should map skillProficiencies', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgVocationRepository.list('en');
      expect(result[0].skillProficiencies).toEqual({
        count: 2,
        choices: ['Athletics', 'Intimidation', 'Survival'],
      });
    });

    it('should query with locale filter and populate features', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgVocationRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { populate: ['features'], orderBy: { title: 'asc' } },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgVocationRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped VocationMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgVocationRepository.getBySlug('en', 'barbarian');
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('barbarian');
    });

    it('should query by locale and slug with features populated', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgVocationRepository.getBySlug('en', 'barbarian');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en', slug: 'barbarian' },
        { populate: ['features'] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgVocationRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgVocationRepository.getBySlug('en', 'barbarian');
      expect(result).toBeNull();
    });
  });
});
