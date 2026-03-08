/**
 * pgMonsterRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL monster repository adapter.
 * Verifies row-mapping from flat `monsters` columns to `MonsterMetadata`
 * and that the correct parameterised SQL is issued.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgMonsterRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgMonsterRepository: typeof import('@/lib/db/content/adapters/pg/pgMonsterRepository').pgMonsterRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgMonsterRepository');
  pgMonsterRepository = mod.pgMonsterRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Minimal flat DB row that exercises the row mapper. */
const flatRow = {
  slug: 'aboleth',
  sub_slug: null,
  title: 'Aboleth',
  file: 'src/content/en/monsters/aboleth.sheet.mdx',
  link: '/library/monsters/aboleth',
  size: 'large',
  creature_type: 'aberration',
  alignment: 'lawful evil',
  cr: '10',
  proficiency_bonus: 4,
  ac_value: 17,
  ac_notes: 'natural armor',
  ac_raw: null,
  hp_average: 135,
  hp_formula: '18d10+36',
  hp_raw: null,
  speed_raw: '10 ft., swim 40 ft.',
  speed_walk: 10,
  speed_fly: null,
  speed_climb: null,
  speed_swim: 40,
  speed_burrow: null,
  speed_land: null,
  speed_hover: false,
  str_score: 21,
  str_mod: 5,
  dex_score: 9,
  dex_mod: -1,
  con_score: 15,
  con_mod: 2,
  int_score: 18,
  int_mod: 4,
  wis_score: 15,
  wis_mod: 2,
  cha_score: 18,
  cha_mod: 4,
  save_str: null,
  save_dex: null,
  save_con: null,
  save_int: 8,
  save_wis: 6,
  save_cha: 8,
  senses_raw: 'darkvision 120 ft., passive Perception 20',
  passive_perception: 20,
  darkvision: 120,
  blindsight: null,
  tremorsense: null,
  truesight: null,
  skills: ['history +12', 'perception +10'],
  damage_resistances: null,
  damage_immunities: null,
  damage_vulnerabilities: null,
  condition_immunities: null,
  languages: ['deep speech', 'telepathy 120 ft.'],
  tags: ['aberration', 'legendary'],
  index_version: 1,
};

describe('pgMonsterRepository', () => {
  describe('list', () => {
    it('should map flat rows to MonsterMetadata objects', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgMonsterRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'aboleth',
        subSlug: undefined,
        title: 'Aboleth',
        creatureType: 'aberration',
        cr: '10',
        ac: { value: 17, notes: 'natural armor' },
        hp: { average: 135, formula: '18d10+36' },
        speed: { raw: '10 ft., swim 40 ft.', modes: { walk: 10, swim: 40 } },
        abilities: { str: { score: 21, mod: 5 }, int: { score: 18, mod: 4 } },
        savingThrows: { int: 8, wis: 6, cha: 8 },
        senses: {
          raw: 'darkvision 120 ft., passive Perception 20',
          passivePerception: 20,
          darkvision: 120,
        },
        skills: ['history +12', 'perception +10'],
        languages: ['deep speech', 'telepathy 120 ft.'],
        tags: ['aberration', 'legendary'],
      });
    });

    it('should query the monsters table with locale', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgMonsterRepository.list('en');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM monsters'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('connection refused'));
      const result = await pgMonsterRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index projection rows', async () => {
      const rows = [
        {
          slug: 'aboleth',
          title: 'Aboleth',
          cr: '10',
          size: 'large',
          creatureType: 'aberration',
        },
      ];
      query.mockResolvedValue({ rows });

      const result = await pgMonsterRepository.listIndex('en');

      expect(result).toEqual(rows);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(sub_slug, slug)'),
        ['en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped MonsterMetadata when found', async () => {
      query.mockResolvedValue({ rows: [flatRow] });

      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('aboleth');
      expect(result?.cr).toBe('10');
    });

    it('should match on sub_slug or slug', async () => {
      query.mockResolvedValue({ rows: [] });
      await pgMonsterRepository.getBySlug('en', 'aboleth');
      const sql = query.mock.calls[0][0] as string;
      expect(sql).toContain('sub_slug');
      expect(sql).toContain('slug');
      expect(query).toHaveBeenCalledWith(expect.any(String), ['en', 'aboleth']);
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgMonsterRepository.getBySlug('en', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(result).toBeNull();
    });
  });
});
