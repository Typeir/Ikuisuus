/**
 * pgMonsterRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL monster repository.
 * Verifies row-mapping from `MonsterEntity` rows to `MonsterMetadata`
 * domain objects and that the correct MikroORM queries are used.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgMonsterRepository
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

let pgMonsterRepository: typeof import('@/lib/db/content/adapters/pg/pgMonsterRepository').pgMonsterRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgMonsterRepository');
  pgMonsterRepository = mod.pgMonsterRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM MonsterEntity row (matches embedded VO structure). */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'aboleth',
  subSlug: null,
  title: 'Aboleth',
  file: 'src/content/en/monsters/aboleth.sheet.mdx',
  link: '/library/monsters/aboleth',
  size: 'large',
  creatureType: 'aberration',
  alignment: 'lawful evil',
  cr: '10',
  proficiencyBonus: 4,
  ac: { value: 17, notes: 'natural armor', raw: null },
  hp: { average: 135, formula: '18d10+36', raw: null },
  speed: {
    raw: '10 ft., swim 40 ft.',
    walk: 10,
    fly: null,
    climb: null,
    swim: 40,
    burrow: null,
    hover: false,
  },
  scores: {
    str: 21,
    dex: 9,
    con: 15,
    int: 18,
    wis: 15,
    cha: 18,
  },
  saves: {
    str: null,
    dex: null,
    con: null,
    int: 8,
    wis: 6,
    cha: 8,
  },
  senses: {
    raw: 'darkvision 120 ft., passive Perception 20',
    passivePerception: 20,
    darkvision: 120,
    blindsight: null,
    tremorsense: null,
    truesight: null,
  },
  skills: ['history +12', 'perception +10'],
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  languages: ['deep speech', 'telepathy 120 ft.'],
  tags: ['aberration', 'legendary'],
  indexVersion: 1,
};

describe('pgMonsterRepository', () => {
  describe('list', () => {
    it('should map entity rows to MonsterMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

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
        speed: { raw: '10 ft., swim 40 ft.', walk: 10, swim: 40 },
        scores: { str: 21, int: 18 },
        saves: { int: 8, wis: 6, cha: 8 },
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

    it('should query with locale filter and slug ordering', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgMonsterRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { orderBy: { slug: 'asc' }, populate: [] },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('connection refused'));
      const result = await pgMonsterRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index projection with subSlug fallback', async () => {
      mockEM.find.mockResolvedValue([
        {
          slug: 'aboleth',
          subSlug: null,
          title: 'Aboleth',
          cr: '10',
          size: 'large',
          creatureType: 'aberration',
        },
      ]);

      const result = await pgMonsterRepository.listIndex('en');

      expect(result).toEqual([
        {
          slug: 'aboleth',
          title: 'Aboleth',
          cr: '10',
          size: 'large',
          creatureType: 'aberration',
        },
      ]);
    });

    it('should use subSlug when present', async () => {
      mockEM.find.mockResolvedValue([
        {
          slug: 'dragon-file',
          subSlug: 'ancient-red-dragon',
          title: 'Ancient Red Dragon',
          cr: '24',
          size: 'gargantuan',
          creatureType: 'dragon',
        },
      ]);

      const result = await pgMonsterRepository.listIndex('en');
      expect(result[0].slug).toBe('ancient-red-dragon');
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped MonsterMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('aboleth');
      expect(result?.cr).toBe('10');
    });

    it('should query with $or condition for subSlug/slug', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(mockEM.findOne).toHaveBeenCalledWith(expect.anything(), {
        locale: 'en',
        $or: [{ subSlug: 'aboleth' }, { slug: 'aboleth' }],
      });
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgMonsterRepository.getBySlug('en', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(result).toBeNull();
    });
  });
});
