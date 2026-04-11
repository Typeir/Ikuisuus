/**
 * walk Utility Unit Tests
 *
 * @fileoverview Tests for directory tree traversal utility with adapter pattern.
 * Uses a mock DirectorySourceAdapter to test tree-building logic in isolation.
 *
 * @module tests/unit/lib/utils/walk
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/walk Module under test
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import { walk, walkTree } from '@/lib/utils/walk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsDirectorySource', () => ({
  fsDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/db/content/adapters/github/githubDirectorySource', () => ({
  githubDirectorySource: { listEntries: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: vi
    .fn()
    .mockReturnValue({ listEntries: vi.fn().mockResolvedValue([]) }),
}));

/**
 * Creates a mock DirectorySourceAdapter from a map of relative paths to entries.
 *
 * @param {Record<string, Array<{ name: string; isDirectory: boolean }>>} dirs - Directory contents keyed by relative path
 * @returns {DirectorySourceAdapter} Mock adapter
 */
function createMockAdapter(
  dirs: Record<string, Array<{ name: string; isDirectory: boolean }>>,
): DirectorySourceAdapter {
  return {
    async listEntries(_locale: string, relativePath: string) {
      return dirs[relativePath] || [];
    },
  };
}

describe('walk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export walk function', () => {
      expect(walk).toBeDefined();
      expect(typeof walk).toBe('function');
    });

    it('should export walkTree function', () => {
      expect(walkTree).toBeDefined();
      expect(typeof walkTree).toBe('function');
    });
  });

  describe('return type', () => {
    it('should return an array for empty directory', async () => {
      const adapter = createMockAdapter({ '': [] });
      const result = await walkTree(adapter, 'en', '', '');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when adapter returns no entries', async () => {
      const adapter = createMockAdapter({});
      const result = await walkTree(adapter, 'en', '', '');
      expect(result).toEqual([]);
    });
  });

  describe('.sheet.mdx file handling', () => {
    it('should strip .sheet from path for .sheet.mdx files', async () => {
      const adapter = createMockAdapter({
        '': [
          {
            name: 'abandoned-old-war-machine.sheet.mdx',
            isDirectory: false,
          },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('abandoned-old-war-machine');
      expect(result[0].path).not.toContain('.sheet');
    });

    it('should handle .sheet.mdx files with spaces in names', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'Ancient Red Dragon.sheet.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('ancient-red-dragon');
    });

    it('should handle .sheet.mdx files with special characters', async () => {
      const adapter = createMockAdapter({
        '': [
          {
            name: 'Albedo, the Bleak Bloom.sheet.mdx',
            isDirectory: false,
          },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('albedo-the-bleak-bloom');
      expect(result[0].name).toBe('Albedo, The Bleak Bloom');
    });

    it('should not add .sheet to regular .mdx files', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'magic-sword.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('magic-sword');
      expect(result[0].path).not.toContain('.sheet');
    });

    it('should handle mixed .sheet.mdx and .mdx files correctly', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'monster.sheet.mdx', isDirectory: false },
          { name: 'item.mdx', isDirectory: false },
          { name: 'spell.mdx', isDirectory: false },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.name === 'Monster')?.path).toBe('monster');
      expect(result.find((r) => r.name === 'Item')?.path).toBe('item');
      expect(result.find((r) => r.name === 'Spell')?.path).toBe('spell');
    });
  });

  describe('content suffix handling (double-extension convention)', () => {
    it('should strip .specialization from path', async () => {
      const adapter = createMockAdapter({
        '': [
          {
            name: 'path-of-the-berserker.specialization.mdx',
            isDirectory: false,
          },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('path-of-the-berserker');
      expect(result[0].name).toBe('Path Of The Berserker');
    });

    it('should strip .list from path', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'spells.list.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('spells');
      expect(result[0].name).toBe('Spells');
    });

    it('should strip .reference from path', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'maneuvers.reference.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('maneuvers');
      expect(result[0].name).toBe('Maneuvers');
    });

    it('should strip .bloodline from path', async () => {
      const adapter = createMockAdapter({
        '': [
          {
            name: 'bloodline-of-the-void.bloodline.mdx',
            isDirectory: false,
          },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('bloodline-of-the-void');
      expect(result[0].name).toBe('Bloodline Of The Void');
    });

    it('should strip .lore from path', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'the-sunken-city.lore.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('the-sunken-city');
      expect(result[0].name).toBe('The Sunken City');
    });

    it('should handle mixed content suffixes correctly', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'berserker.specialization.mdx', isDirectory: false },
          { name: 'maneuvers.reference.mdx', isDirectory: false },
          { name: 'spells.list.mdx', isDirectory: false },
          { name: 'plain-file.mdx', isDirectory: false },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(4);
      expect(result.find((r) => r.name === 'Berserker')?.path).toBe(
        'berserker',
      );
      expect(result.find((r) => r.name === 'Maneuvers')?.path).toBe(
        'maneuvers',
      );
      expect(result.find((r) => r.name === 'Spells')?.path).toBe('spells');
      expect(result.find((r) => r.name === 'Plain File')?.path).toBe(
        'plain-file',
      );
    });

    it('should construct correct nested paths with content suffixes stripped', async () => {
      const adapter = createMockAdapter({
        '': [
          {
            name: 'life-domain.specialization.mdx',
            isDirectory: false,
          },
        ],
      });

      const result = await walkTree(
        adapter,
        'en',
        '',
        'library/vocations/cleric',
      );

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('library/vocations/cleric/life-domain');
    });
  });

  describe('path construction with base path', () => {
    it('should construct correct nested paths for .sheet.mdx files', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'dragon.sheet.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', 'library/monsters');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('library/monsters/dragon');
    });

    it('should handle deeply nested .sheet.mdx files', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'monsters', isDirectory: true }],
        monsters: [{ name: 'boss.sheet.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].children).toBeDefined();
      expect(result[0].children?.[0]?.path).toBe('monsters/boss');
    });
  });

  describe('edge cases and conventions', () => {
    it('should handle files with multiple dots correctly', async () => {
      const adapter = createMockAdapter({
        '': [{ name: 'v2.0.draft.mdx', isDirectory: false }],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('v20draft');
    });

    it('should deduplicate .sheet.mdx and .mdx files with same base name', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'dragon.sheet.mdx', isDirectory: false },
          { name: 'dragon.mdx', isDirectory: false },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('dragon');
    });

    it('should ignore .hidden. files', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'visible.mdx', isDirectory: false },
          { name: 'file.hidden.mdx', isDirectory: false },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Visible');
    });

    it('should ignore configured folders', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'content.mdx', isDirectory: false },
          { name: '.obsidian', isDirectory: true },
          { name: 'node_modules', isDirectory: true },
        ],
      });

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Content');
    });

    it('should ignore any folder whose name starts with a dot', async () => {
      const adapter = createMockAdapter({
        '': [
          { name: 'visible-folder', isDirectory: true },
          { name: '.draft', isDirectory: true },
          { name: '.wip', isDirectory: true },
          { name: 'article.mdx', isDirectory: false },
        ],
        'visible-folder': [],
      });

      const result = await walkTree(adapter, 'en', '', '');

      const names = result.map((r) => r.name);
      expect(names).not.toContain('Draft');
      expect(names).not.toContain('Wip');
      expect(names).toContain('Article');
    });
  });
});
