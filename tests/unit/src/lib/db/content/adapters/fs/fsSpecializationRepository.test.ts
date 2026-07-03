/**
 * fsSpecializationRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem specialization repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsSpecializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsSpecializationRepository: typeof import('@/lib/db/content/adapters/fs/fsSpecializationRepository').fsSpecializationRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod =
    await import('@/lib/db/content/adapters/fs/fsSpecializationRepository');
  fsSpecializationRepository = mod.fsSpecializationRepository;
});

afterEach(() => vi.restoreAllMocks());

const SPECIALIZATIONS = [
  {
    slug: 'path-of-the-berserker',
    title: 'Path of Frenzy',
    vocation: 'Berserker',
    specializationType: 'Path',
    features: [{ level: 3, name: 'Frenzy' }],
    tags: [],
  },
  {
    slug: 'path-of-the-totem',
    title: 'Path of the Totem Warrior',
    vocation: 'Berserker',
    specializationType: 'Path',
    features: [{ level: 3, name: 'Totem Spirit' }],
    tags: [],
  },
  {
    slug: 'life-domain',
    title: 'Life Domain',
    vocation: 'Pilgrim',
    specializationType: 'Domain',
    features: [{ level: 1, name: 'Bonus Proficiency' }],
    tags: [],
  },
];

describe('fsSpecializationRepository', () => {
  describe('list', () => {
    it('should return all specialization metadata', async () => {
      readMetadataFiles.mockReturnValue(SPECIALIZATIONS);
      const result = await fsSpecializationRepository.list('en');
      expect(result).toEqual(SPECIALIZATIONS);
    });

    it('should filter out non-specialization records', async () => {
      const mixed = [
        ...SPECIALIZATIONS,
        {
          slug: 'Berserker',
          title: 'Berserker',
          archetype: 'Martial',
          hitDie: 'd12',
        },
      ];
      readMetadataFiles.mockReturnValue(mixed);
      const result = await fsSpecializationRepository.list('en');
      expect(result).toHaveLength(3);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpecializationRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find specialization by slug', async () => {
      readMetadataFiles.mockReturnValue(SPECIALIZATIONS);
      const result = await fsSpecializationRepository.getBySlug(
        'en',
        'path-of-the-berserker',
      );
      expect(result?.title).toBe('Path of Frenzy');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(SPECIALIZATIONS);
      const result = await fsSpecializationRepository.getBySlug(
        'en',
        'missing',
      );
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpecializationRepository.getBySlug(
        'en',
        'path-of-the-berserker',
      );
      expect(result).toBeNull();
    });
  });

  describe('listByVocation', () => {
    it('should filter specializations by vocation', async () => {
      readMetadataFiles.mockReturnValue(SPECIALIZATIONS);
      const result = await fsSpecializationRepository.listByVocation(
        'en',
        'Berserker',
      );
      expect(result).toHaveLength(2);
      expect(result[0].vocation).toBe('Berserker');
    });

    it('should return empty array when no matches', async () => {
      readMetadataFiles.mockReturnValue(SPECIALIZATIONS);
      const result = await fsSpecializationRepository.listByVocation(
        'en',
        'paladin',
      );
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpecializationRepository.listByVocation(
        'en',
        'Berserker',
      );
      expect(result).toEqual([]);
    });
  });
});
