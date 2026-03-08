/**
 * pgTrinketRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL trinket repository adapter.
 * Verifies row-mapping from flat `trinkets` columns to `TrinketMetadata`
 * and that the correct parameterised SQL is issued.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgTrinketRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgTrinketRepository: typeof import('@/lib/db/content/adapters/pg/pgTrinketRepository').pgTrinketRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgTrinketRepository');
  pgTrinketRepository = mod.pgTrinketRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Minimal flat DB row that exercises the row mapper. */
const flatRow = {
  slug: 'lucky-coin',
  title: 'Lucky Coin',
  file: 'src/content/en/items/trinkets/lucky-coin.mdx',
  link: '/library/items/trinkets/lucky-coin',
  item_type: 'coin',
  damage: null,
  damage_type: null,
  range: null,
  weight: null,
  saving_throw_dc: null,
  saving_throw_ability: null,
  properties: ['shiny'],
  special_effects: ['reroll one d20 per day'],
  inflicts_conditions: null,
  tags: ['luck', 'passive'],
};

describe('pgTrinketRepository', () => {
  describe('list', () => {
    it('should map flat rows to TrinketMetadata objects', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgTrinketRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'lucky-coin',
        title: 'Lucky Coin',
        itemType: 'coin',
        properties: ['shiny'],
        specialEffects: ['reroll one d20 per day'],
        inflictsConditions: undefined,
        tags: ['luck', 'passive'],
      });
    });

    it('should query the trinkets table with locale', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgTrinketRepository.list('en');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM trinkets'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped TrinketMetadata when found', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('lucky-coin');
      expect(result?.itemType).toBe('coin');
    });

    it('should query by locale and slug', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('slug = $2'),
        ['en', 'lucky-coin'],
      );
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgTrinketRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result).toBeNull();
    });
  });
});
