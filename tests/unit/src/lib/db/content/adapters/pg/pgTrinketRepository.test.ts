/**
 * pgTrinketRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL trinket repository.
 * Verifies row-mapping from `TrinketEntity` rows (with embedded saving throw)
 * to `TrinketMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgTrinketRepository
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

let pgTrinketRepository: typeof import('@/lib/db/content/adapters/pg/pgTrinketRepository').pgTrinketRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgTrinketRepository');
  pgTrinketRepository = mod.pgTrinketRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM TrinketEntity row (matches embedded VO structure). */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'lucky-coin',
  title: 'Lucky Coin',
  file: 'src/content/en/items/trinkets/lucky-coin.mdx',
  link: '/library/items/trinkets/lucky-coin',
  itemType: 'coin',
  damage: null,
  damageType: null,
  range: null,
  weight: null,
  savingThrow: { dc: null, ability: null },
  properties: ['shiny'],
  specialEffects: ['reroll one d20 per day'],
  inflictsConditions: [],
  tags: ['luck', 'passive'],
};

describe('pgTrinketRepository', () => {
  describe('list', () => {
    it('should map entity rows to TrinketMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgTrinketRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'lucky-coin',
        title: 'Lucky Coin',
        itemType: 'coin',
        properties: ['shiny'],
        specialEffects: ['reroll one d20 per day'],
        tags: ['luck', 'passive'],
      });
    });

    it('should query with locale filter and slug ordering', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgTrinketRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { orderBy: { title: 'asc' }, populate: [] },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped TrinketMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('lucky-coin');
      expect(result?.itemType).toBe('coin');
    });

    it('should query by locale and slug', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        {
          locale: 'en',
          slug: 'lucky-coin',
        },
        { populate: [] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgTrinketRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result).toBeNull();
    });
  });
});
