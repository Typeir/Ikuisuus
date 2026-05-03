/**
 * repositoryWalk Unit Tests
 *
 * @fileoverview Tests for the environment-coupled walk wrappers.
 * Mocks both `directorySourceResolver` (for `repositoryWalk`) and
 * `fileTreeService` (for `repositoryShallowWalk`) to verify adapter
 * wiring without filesystem access.
 *
 * @module tests/unit/lib/utils/repositoryWalk
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/repositoryWalk Module under test
 */

import type { DirectoryEntry } from '@/lib/db/content/directorySourceAdapter';
import type { ListDirectoryResult } from '@/lib/db/content/fileTreeService';
import {
    repositoryShallowWalk,
    repositoryWalk,
} from '@/lib/utils/repositoryWalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockListEntries =
  vi.fn<(locale: string, relativePath: string) => Promise<DirectoryEntry[]>>();

vi.mock('@/lib/db/content/adapters/fs/fsDirectorySource', () => ({
  fsDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/db/content/adapters/github/githubDirectorySource', () => ({
  githubDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: vi.fn(() => ({ listEntries: mockListEntries })),
}));

const mockListDirectory =
  vi.fn<
    (
      locale: string,
      relativePath?: string,
      opts?: object,
    ) => Promise<ListDirectoryResult>
  >();
vi.mock('@/lib/db/content/fileTreeService', () => ({
  listDirectory: (...args: Parameters<typeof mockListDirectory>) =>
    mockListDirectory(...args),
}));

/**
 * Builds a mock ListDirectoryResult from an entries array.
 *
 * @param {DirectoryEntry[]} entries - Entries to wrap
 * @returns {ListDirectoryResult} Mock result
 */
function makeListResult(entries: DirectoryEntry[]): ListDirectoryResult {
  return { entries, total: entries.length };
}

describe('repositoryWalk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export repositoryWalk function', () => {
      expect(repositoryWalk).toBeDefined();
      expect(typeof repositoryWalk).toBe('function');
    });

    it('should export repositoryShallowWalk function', () => {
      expect(repositoryShallowWalk).toBeDefined();
      expect(typeof repositoryShallowWalk).toBe('function');
    });
  });

  describe('repositoryWalk', () => {
    it('should return empty array when adapter returns no entries', async () => {
      mockListEntries.mockResolvedValue([]);
      const result = await repositoryWalk('en');
      expect(result).toEqual([]);
    });

    it('should convert a flat .mdx file through the adapter', async () => {
      mockListEntries.mockResolvedValue([
        { name: 'fireball.mdx', isDirectory: false },
      ]);
      const result = await repositoryWalk('en');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fireball');
      expect(result[0].path).toBe('fireball');
    });

    it('should recurse into directories via the adapter', async () => {
      mockListEntries.mockImplementation(
        async (_locale: string, relativePath: string) => {
          if (!relativePath) return [{ name: 'spells', isDirectory: true }];
          if (relativePath === 'spells')
            return [{ name: 'fireball.mdx', isDirectory: false }];
          return [];
        },
      );
      const result = await repositoryWalk('en');
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].path).toBe('spells/fireball');
    });
  });

  describe('repositoryShallowWalk', () => {
    it('should return empty array when root has no entries', async () => {
      mockListDirectory.mockResolvedValue(makeListResult([]));
      const result = await repositoryShallowWalk('en');
      expect(result).toEqual([]);
    });

    it('should return leaf nodes for files at root', async () => {
      mockListDirectory.mockResolvedValue(
        makeListResult([{ name: 'fireball.mdx', isDirectory: false }]),
      );
      const result = await repositoryShallowWalk('en');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fireball');
      expect(result[0].path).toBe('fireball');
    });

    it('should stub directories beyond maxDepth', async () => {
      mockListDirectory.mockResolvedValue(
        makeListResult([{ name: 'spells', isDirectory: true }]),
      );
      const result = await repositoryShallowWalk('en', '', 1);
      expect(result).toHaveLength(1);
      expect(result[0].isStub).toBe(true);
      expect(result[0].children).toEqual([]);
    });

    it('should recurse into directories within maxDepth', async () => {
      mockListDirectory.mockImplementation(async (_locale, relativePath) => {
        if (!relativePath) {
          return makeListResult([{ name: 'spells', isDirectory: true }]);
        }
        if (relativePath === 'spells') {
          return makeListResult([{ name: 'fireball.mdx', isDirectory: false }]);
        }
        return makeListResult([]);
      });

      const result = await repositoryShallowWalk('en', '', 2);
      expect(result[0].isStub).toBeUndefined();
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].path).toBe('spells/fireball');
    });

    it('should build child paths relative to relativePath when given a starting path', async () => {
      mockListDirectory.mockImplementation(async (_locale, relativePath) => {
        if (relativePath === 'character-creation/vocations') {
          return makeListResult([{ name: 'barbarian', isDirectory: true }]);
        }
        return makeListResult([]);
      });

      const result = await repositoryShallowWalk(
        'en',
        'character-creation/vocations',
        1,
      );
      expect(result[0].path).toBe('character-creation/vocations/barbarian');
      expect(result[0].isStub).toBe(true);
    });
  });
});
