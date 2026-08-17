/**
 * pgBloodlineRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL bloodline repository.
 * Verifies row-mapping from `BloodlineEntity` rows (with populated boons)
 * to `BloodlineMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgBloodlineRepository
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

let pgBloodlineRepository: typeof import('@/lib/db/content/adapters/pg/pgBloodlineRepository').pgBloodlineRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod =
    await import('@/lib/db/content/adapters/pg/pgBloodlineRepository');
  pgBloodlineRepository = mod.pgBloodlineRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** Simulates a MikroORM BloodlineEntity row with Collection-like boons. */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'empyrean',
  title: 'Empyrean',
  file: 'src/content/en/character-creation/bloodlines/empyrean.mdx',
  link: '/library/character-creation/bloodlines/empyrean',
  description: 'Lore text',
  abilityScores: ['DEX +2', 'CHA +1'],
  movementSpeeds: ['Walk: 30 ft.'],
  senses: ['Darkvision 30 ft.'],
  size: ['Medium'],
  creatureTypes: ['Humanoid'],
  age: 'Centuries (Foulblood ~100 yr)',
  boonBudget: 10,
  tags: ['humanoid'],
  indexVersion: 1,
  versionHash: null,
  features: { getItems: () => [] },
  boons: {
    getItems: () => [
      {
        name: 'Extended Reach',
        bpLabel: '6 BP',
        bpValue: 6,
        sortOrder: 0,
        tags: ['mechanic:weapon-reach', 'mechanic:weapon'],
        options: { getItems: () => [] },
      },
      {
        name: 'First Step',
        bpLabel: '5 BP',
        bpValue: 5,
        sortOrder: 1,
        tags: [
          'mechanic:bonus-action',
          'mechanic:recovery-recharge',
          'movement:enhanced',
        ],
        options: { getItems: () => [] },
      },
      {
        name: 'Frame',
        bpLabel: 'Variable - Choose One',
        bpValue: null,
        sortOrder: 2,
        tags: ['resource:variable'],
        options: {
          getItems: () => [
            { name: 'Large Frame', anchor: 'large-frame', bpValue: 3, effect: 'Large', tags: ['size:large'], sortOrder: 1 },
            { name: 'Powerful Build', anchor: 'powerful-build', bpValue: 1, effect: null, tags: [], sortOrder: 0 },
          ],
        },
      },
    ],
  },
};

describe('pgBloodlineRepository', () => {
  describe('list', () => {
    it('should map entity rows to BloodlineMetadata objects', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgBloodlineRepository.list('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'empyrean',
        title: 'Empyrean',
        description: 'Lore text',
        coreFeatures: {
          abilityScores: ['DEX +2', 'CHA +1'],
          size: ['Medium'],
          creatureTypes: ['Humanoid'],
          age: 'Centuries (Foulblood ~100 yr)',
        },
        boonBudget: 10,
        tags: ['humanoid'],
      });
    });

    it('should map boons in sort order', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const result = await pgBloodlineRepository.list('en');
      const boons = result[0].boons;

      expect(boons).toHaveLength(3);
      expect(boons[2].subOptions?.map((o) => o.name)).toEqual(['Powerful Build', 'Large Frame']);
      expect(boons[2].subOptionMode).toBe('choose-one');
      expect(boons[2].subOptions?.[1]).toMatchObject({ anchor: 'large-frame', bpValue: 3, effect: 'Large', tags: ['size:large'] });
      expect(boons[0].name).toBe('Extended Reach');
      expect(boons[0].bpValue).toBe(6);
      expect(boons[0].tags).toContain('mechanic:weapon-reach');
      expect(boons[1].name).toBe('First Step');
      expect(boons[1].tags).toContain('mechanic:bonus-action');
    });

    it('should query with locale filter and populate boons', async () => {
      mockEM.find.mockResolvedValue([]);
      await pgBloodlineRepository.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en' },
        { populate: ['boons', 'boons.options', 'features'], orderBy: { title: 'asc' } },
      );
    });

    it('should return empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('fail'));
      const result = await pgBloodlineRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return mapped BloodlineMetadata when found', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const result = await pgBloodlineRepository.getBySlug('en', 'empyrean');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('empyrean');
      expect(result?.boons).toHaveLength(3);
    });

    it('should query by locale and slug with boons populated', async () => {
      mockEM.findOne.mockResolvedValue(null);
      await pgBloodlineRepository.getBySlug('en', 'empyrean');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { locale: 'en', slug: 'empyrean' },
        { populate: ['boons', 'boons.options', 'features'] },
      );
    });

    it('should return null when not found', async () => {
      mockEM.findOne.mockResolvedValue(null);
      const result = await pgBloodlineRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('fail'));
      const result = await pgBloodlineRepository.getBySlug('en', 'empyrean');
      expect(result).toBeNull();
    });
  });
});
