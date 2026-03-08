/**
 * pgSpellRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL spell repository adapter.
 * Verifies row-mapping from flat `spells` + aggregated `spell_lists` columns
 * to `SpellMetadata`, and that the correct parameterised SQL is issued.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgSpellRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgSpellRepository: typeof import('@/lib/db/content/adapters/pg/pgSpellRepository').pgSpellRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgSpellRepository');
  pgSpellRepository = mod.pgSpellRepository;
});

afterEach(() => vi.restoreAllMocks());

/**
 * Flat DB row as returned by the spells + spell_lists LEFT JOIN query.
 * `spell_lists` is the json_agg result from Postgres.
 */
const flatRow = {
  id: 1,
  slug: 'fireball',
  title: 'Fireball',
  file: 'src/content/en/spells/fireball.mdx',
  link: '/library/spells/fireball',
  level: 3,
  school: 'evocation',
  quality: null,
  casting_time_raw: '1 action',
  casting_time: ['action'],
  range: '150 feet',
  concentration: false,
  duration: 'Instantaneous',
  verbal: true,
  somatic: true,
  material: true,
  material_description: 'a tiny ball of bat guano and sulfur',
  has_ritual: false,
  tags: ['damage', 'fire', 'area'],
  spell_lists: [
    { name: 'Sorcerer', link: '/library/classes/sorcerer' },
    { name: 'Wizard', link: '/library/classes/wizard' },
  ],
};

describe('pgSpellRepository', () => {
  describe('list', () => {
    it('should map flat rows (with aggregated spell_lists) to SpellMetadata', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

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

    it('should set spellLists to undefined when the array is empty', async () => {
      query.mockResolvedValue({ rows: [{ ...flatRow, spell_lists: [] }] });
      const result = await pgSpellRepository.list('en');
      expect(result[0].spellLists).toBeUndefined();
    });

    it('should query the spells table with locale', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgSpellRepository.list('en');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM spells'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index rows', async () => {
      const rows = [
        { slug: 'fireball', title: 'Fireball', level: 3, school: 'evocation' },
      ];
      query.mockResolvedValue({ rows });

      const result = await pgSpellRepository.listIndex('en');

      expect(result).toEqual(rows);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM spells'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('listBySlugs', () => {
    it('should delegate to list() when slugs array is empty', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgSpellRepository.listBySlugs('en', []);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('fireball');
    });

    it('should filter by ANY(slugs) when slugs are provided', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);

      expect(result[0].slug).toBe('fireball');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ANY($2)'),
        ['en', ['fireball']],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped SpellMetadata when found', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgSpellRepository.getBySlug('en', 'fireball');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('fireball');
      expect(result?.level).toBe(3);
    });

    it('should query by locale and slug', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgSpellRepository.getBySlug('en', 'fireball');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('s.slug = $2'),
        ['en', 'fireball'],
      );
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgSpellRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.getBySlug('en', 'fireball');
      expect(result).toBeNull();
    });
  });
});
