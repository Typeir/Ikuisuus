/**
 * fsVocationRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem vocation repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsVocationRepository
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

let fsVocationRepository: typeof import('@/lib/db/content/adapters/fs/fsVocationRepository').fsVocationRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsVocationRepository');
  fsVocationRepository = mod.fsVocationRepository;
});

afterEach(() => vi.restoreAllMocks());

const VOCATIONS = [
  {
    slug: 'Berserker',
    title: 'Berserker',
    archetype: 'Martial',
    hitDie: 'd12',
    features: [{ level: 1, name: 'Rage' }],
    tags: [],
  },
  {
    slug: 'Pilgrim',
    title: 'Pilgrim',
    archetype: 'Full Caster',
    hitDie: 'd8',
    features: [{ level: 1, name: 'Spellcasting' }],
    tags: [],
  },
];

describe('fsVocationRepository', () => {
  describe('list', () => {
    it('should return all vocation metadata', async () => {
      readMetadataFiles.mockReturnValue(VOCATIONS);
      const result = await fsVocationRepository.list('en');
      expect(result).toEqual(VOCATIONS);
    });

    it('should filter out non-vocation records', async () => {
      const mixed = [
        ...VOCATIONS,
        {
          slug: 'berserker',
          title: 'Berserker',
          vocation: 'Berserker',
          specializationType: 'Path',
        },
      ];
      readMetadataFiles.mockReturnValue(mixed);
      const result = await fsVocationRepository.list('en');
      expect(result).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsVocationRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find vocation by slug', async () => {
      readMetadataFiles.mockReturnValue(VOCATIONS);
      const result = await fsVocationRepository.getBySlug('en', 'Berserker');
      expect(result?.title).toBe('Berserker');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(VOCATIONS);
      const result = await fsVocationRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsVocationRepository.getBySlug('en', 'Berserker');
      expect(result).toBeNull();
    });
  });
});
