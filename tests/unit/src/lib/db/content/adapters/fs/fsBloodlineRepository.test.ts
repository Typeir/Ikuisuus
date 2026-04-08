/**
 * fsBloodlineRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem bloodline repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsBloodlineRepository
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

let fsBloodlineRepository: typeof import('@/lib/db/content/adapters/fs/fsBloodlineRepository').fsBloodlineRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod =
    await import('@/lib/db/content/adapters/fs/fsBloodlineRepository');
  fsBloodlineRepository = mod.fsBloodlineRepository;
});

afterEach(() => vi.restoreAllMocks());

const BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    coreFeatures: {
      abilityScores: ['DEX +2'],
      movementSpeeds: [],
      senses: [],
      size: [],
      creatureTypes: [],
    },
    boons: [],
  },
  {
    slug: 'edaphite',
    title: 'Edaphite',
    coreFeatures: {
      abilityScores: ['ALL SCORES +1'],
      movementSpeeds: [],
      senses: [],
      size: [],
      creatureTypes: [],
    },
    boons: [],
  },
];

describe('fsBloodlineRepository', () => {
  describe('list', () => {
    it('should return all bloodline metadata', async () => {
      readMetadataFiles.mockReturnValue(BLOODLINES);
      const result = await fsBloodlineRepository.list('en');
      expect(result).toEqual(BLOODLINES);
    });

    it('should filter out null entries from excluded files', async () => {
      readMetadataFiles.mockReturnValue([null, BLOODLINES[0], null]);
      const result = await fsBloodlineRepository.list('en');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('empyrean');
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsBloodlineRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find bloodline by slug', async () => {
      readMetadataFiles.mockReturnValue(BLOODLINES);
      const result = await fsBloodlineRepository.getBySlug('en', 'empyrean');
      expect(result?.title).toBe('Empyrean');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(BLOODLINES);
      const result = await fsBloodlineRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsBloodlineRepository.getBySlug('en', 'empyrean');
      expect(result).toBeNull();
    });
  });
});
