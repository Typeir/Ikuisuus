/**
 * pgMonsterRepository Unit Tests
 *
 * @fileoverview Tests for the Prisma-backed PostgreSQL monster repository.
 * Verifies row-mapping from Prisma `Monster` rows to `MonsterMetadata`
 * domain objects and that the correct Prisma queries are used.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgMonsterRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/prisma/client', () => ({
  prisma: {
    monster: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgMonsterRepository: typeof import('@/lib/db/content/adapters/pg/pgMonsterRepository').pgMonsterRepository;
let prisma: typeof import('@/lib/db/prisma/client').prisma;

beforeEach(async () => {
  vi.resetModules();
  const client = await import('@/lib/db/prisma/client');
  prisma = client.prisma;

  const mod = await import('@/lib/db/content/adapters/pg/pgMonsterRepository');
  pgMonsterRepository = mod.pgMonsterRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Prisma Monster row (camelCase, no modifiers). */
const prismaRow = {
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
  acValue: 17,
  acNotes: 'natural armor',
  acRaw: null,
  hpAverage: 135,
  hpFormula: '18d10+36',
  hpRaw: null,
  speedRaw: '10 ft., swim 40 ft.',
  speedWalk: 10,
  speedFly: null,
  speedClimb: null,
  speedSwim: 40,
  speedBurrow: null,
  speedHover: false,
  strScore: 21,
  dexScore: 9,
  conScore: 15,
  intScore: 18,
  wisScore: 15,
  chaScore: 18,
  saveStr: null,
  saveDex: null,
  saveCon: null,
  saveInt: 8,
  saveWis: 6,
  saveCha: 8,
  sensesRaw: 'darkvision 120 ft., passive Perception 20',
  passivePerception: 20,
  darkvision: 120,
  blindsight: null,
  tremorsense: null,
  truesight: null,
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
    it('should map Prisma rows to MonsterMetadata objects', async () => {
      vi.mocked(prisma.monster.findMany).mockResolvedValue([prismaRow as never]);

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
        abilities: { str: { score: 21 }, int: { score: 18 } },
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

    it('should query with locale filter and slug ordering', async () => {
      vi.mocked(prisma.monster.findMany).mockResolvedValue([]);
      await pgMonsterRepository.list('en');
      expect(prisma.monster.findMany).toHaveBeenCalledWith({
        where: { locale: 'en' },
        orderBy: { slug: 'asc' },
      });
    });

    it('should return empty array on error', async () => {
      vi.mocked(prisma.monster.findMany).mockRejectedValue(
        new Error('connection refused'),
      );
      const result = await pgMonsterRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index projection with subSlug fallback', async () => {
      vi.mocked(prisma.monster.findMany).mockResolvedValue([
        {
          slug: 'aboleth',
          subSlug: null,
          title: 'Aboleth',
          cr: '10',
          size: 'large',
          creatureType: 'aberration',
        } as never,
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
      vi.mocked(prisma.monster.findMany).mockResolvedValue([
        {
          slug: 'dragon-file',
          subSlug: 'ancient-red-dragon',
          title: 'Ancient Red Dragon',
          cr: '24',
          size: 'gargantuan',
          creatureType: 'dragon',
        } as never,
      ]);

      const result = await pgMonsterRepository.listIndex('en');
      expect(result[0].slug).toBe('ancient-red-dragon');
    });

    it('should return empty array on error', async () => {
      vi.mocked(prisma.monster.findMany).mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped MonsterMetadata when found', async () => {
      vi.mocked(prisma.monster.findFirst).mockResolvedValue(prismaRow as never);

      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('aboleth');
      expect(result?.cr).toBe('10');
    });

    it('should query with OR condition for subSlug/slug', async () => {
      vi.mocked(prisma.monster.findFirst).mockResolvedValue(null);
      await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(prisma.monster.findFirst).toHaveBeenCalledWith({
        where: {
          locale: 'en',
          OR: [{ subSlug: 'aboleth' }, { slug: 'aboleth' }],
        },
      });
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.monster.findFirst).mockResolvedValue(null);
      const result = await pgMonsterRepository.getBySlug('en', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(prisma.monster.findFirst).mockRejectedValue(
        new Error('fail'),
      );
      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(result).toBeNull();
    });
  });
});
