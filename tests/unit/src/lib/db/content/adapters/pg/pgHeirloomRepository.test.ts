/**
 * pgHeirloomRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL heirloom repository.
 * Verifies `HeirloomEntity` row-mapping (with embedded charges) to `HeirloomMetadata`.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgHeirloomRepository
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

let pgHeirloomRepository: typeof import('@/lib/db/content/adapters/pg/pgHeirloomRepository').pgHeirloomRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgHeirloomRepository');
  pgHeirloomRepository = mod.pgHeirloomRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM HeirloomEntity row (matches embedded VO structure). */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'flame-tongue',
  title: 'Flame Tongue',
  file: 'src/content/en/items/heirlooms/flame-tongue.mdx',
  link: '/library/items/heirlooms/flame-tongue',
  rarity: 'rare',
  itemType: 'weapon',
  weaponType: 'longsword',
  requiresAttunement: true,
  attunementRequirements: 'by a creature that can speak Elvish',
  weaponDamage: '1d8',
  weaponDamageType: 'slashing',
  versatileDamage: '1d10',
  hitModifier: 0,
  range: null,
  weight: '3 lb.',
  charges: {
    initial: '10',
    recharge: '1d6+4 at dawn',
    depletes: true,
  },
  mastery: ['vex'],
  weaponProperties: ['versatile', 'finesse'],
  damageTypesDealt: ['slashing', 'fire'],
  savingThrowTypes: [],
  tags: ['fire', 'sword'],
  indexVersion: 1,
};

describe('pgHeirloomRepository', () => {
  describe('list', () => {
    it('should map entity rows to HeirloomMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgHeirloomRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'flame-tongue',
        title: 'Flame Tongue',
        rarity: 'rare',
        itemType: 'weapon',
        weaponType: 'longsword',
        requiresAttunement: true,
        weaponDamage: '1d8',
        weaponDamageType: 'slashing',
        versatileDamage: '1d10',
        weight: '3 lb.',
        charges: { initial: '10', recharge: '1d6+4 at dawn', depletes: true },
        mastery: ['vex'],
        weaponProperties: ['versatile', 'finesse'],
        damageTypesDealt: ['slashing', 'fire'],
        tags: ['fire', 'sword'],
      });
    });

    it('should query with locale filter and slug ordering', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgHeirloomRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { orderBy: { slug: 'asc' }, populate: [] },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped HeirloomMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('flame-tongue');
      expect(result?.rarity).toBe('rare');
    });

    it('should query by locale and slug', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        {
          locale: 'en',
          slug: 'flame-tongue',
        },
        { populate: [] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgHeirloomRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result).toBeNull();
    });
  });
});
