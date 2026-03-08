/**
 * pgHeirloomRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL heirloom repository adapter.
 * Verifies row-mapping from flat `heirlooms` columns to `HeirloomMetadata`
 * and that the correct parameterised SQL is issued.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgHeirloomRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgHeirloomRepository: typeof import('@/lib/db/content/adapters/pg/pgHeirloomRepository').pgHeirloomRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgHeirloomRepository');
  pgHeirloomRepository = mod.pgHeirloomRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Minimal flat DB row that exercises the row mapper. */
const flatRow = {
  slug: 'flame-tongue',
  title: 'Flame Tongue',
  file: 'src/content/en/items/heirlooms/flame-tongue.mdx',
  link: '/library/items/heirlooms/flame-tongue',
  rarity: 'rare',
  item_type: 'weapon',
  weapon_type: 'longsword',
  requires_attunement: true,
  attunement_requirements: 'by a creature that can speak Elvish',
  weapon_damage: '1d8',
  weapon_damage_type: 'slashing',
  versatile_damage: '1d10',
  hit_modifier: 0,
  range: null,
  weight: '3 lb.',
  charges_initial: '10',
  charges_recharge: '1d6+4 at dawn',
  charges_depletes: true,
  mastery: ['vex'],
  weapon_properties: ['versatile', 'finesse'],
  damage_types_dealt: ['slashing', 'fire'],
  saving_throw_types: null,
  tags: ['fire', 'sword'],
  index_version: 1,
};

describe('pgHeirloomRepository', () => {
  describe('list', () => {
    it('should map flat rows to HeirloomMetadata objects', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgHeirloomRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'flame-tongue',
        title: 'Flame Tongue',
        rarity: 'rare',
        itemType: 'weapon',
        weaponType: 'longsword',
        requiresAttunement: true,
        weaponDamage: { damage: '1d8', damageType: 'slashing', versatileDamage: '1d10' },
        weight: '3 lb.',
        charges: { initial: '10', recharge: '1d6+4 at dawn', depletes: true },
        mastery: ['vex'],
        weaponProperties: ['versatile', 'finesse'],
        damageTypesDealt: ['slashing', 'fire'],
        tags: ['fire', 'sword'],
      });
    });

    it('should query the heirlooms table with locale', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgHeirloomRepository.list('en');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM heirlooms'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped HeirloomMetadata when found', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('flame-tongue');
      expect(result?.rarity).toBe('rare');
    });

    it('should query by locale and slug', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('slug = $2'),
        ['en', 'flame-tongue'],
      );
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgHeirloomRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result).toBeNull();
    });
  });
});
