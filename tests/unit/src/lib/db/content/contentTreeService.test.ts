/**
 * @fileoverview Unit Tests — contentTreeService
 * @description Validates recursive tree building, filtering, sorting, and path
 * construction logic in buildContentTree and listContentTree.
 *
 * @module tests/unit/lib/db/content/contentTreeService
 */

import { buildContentTree } from '@/lib/db/content/contentTreeService';
import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: vi.fn(() => ({
    listEntries: vi.fn().mockResolvedValue([]),
  })),
}));

describe('buildContentTree', () => {
  it('returns an empty array for an empty directory', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toEqual([]);
  });

  it('includes files with .mdx extension as leaf nodes', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi
        .fn()
        .mockResolvedValue([{ name: 'goblin.sheet.mdx', isDirectory: false }]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('goblin.sheet.mdx');
    expect(result[0].isFile).toBe(true);
    expect(result[0].children).toEqual([]);
  });

  it('excludes files that do not have .mdx extension', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: 'README.md', isDirectory: false },
        { name: 'data.json', isDirectory: false },
        { name: 'image.png', isDirectory: false },
      ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toHaveLength(0);
  });

  it('excludes dot-prefixed entries (hidden files and git folders)', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: '.hidden.mdx', isDirectory: false },
        { name: '.git', isDirectory: true },
        { name: '.obsidian', isDirectory: true },
      ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toHaveLength(0);
  });

  it('excludes entries with .hidden. in their name', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: 'draft.hidden.mdx', isDirectory: false },
        { name: 'visible.mdx', isDirectory: false },
      ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('visible.mdx');
  });

  it('builds a nested tree for subdirectories', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi
        .fn()
        .mockResolvedValueOnce([{ name: 'monsters', isDirectory: true }])
        .mockResolvedValueOnce([
          { name: 'goblin.sheet.mdx', isDirectory: false },
        ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result[0].name).toBe('monsters');
    expect(result[0].isFile).toBeUndefined();
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe('goblin.sheet.mdx');
    expect(result[0].children[0].isFile).toBe(true);
  });

  it('sorts entries alphabetically by name', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: 'z-monster.sheet.mdx', isDirectory: false },
        { name: 'a-monster.sheet.mdx', isDirectory: false },
        { name: 'm-monster.sheet.mdx', isDirectory: false },
      ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result[0].name).toBe('a-monster.sheet.mdx');
    expect(result[1].name).toBe('m-monster.sheet.mdx');
    expect(result[2].name).toBe('z-monster.sheet.mdx');
  });

  it('constructs file path as locale/relativePath/name', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi
        .fn()
        .mockResolvedValue([{ name: 'goblin.sheet.mdx', isDirectory: false }]),
    };

    const result = await buildContentTree(adapter, 'en', 'monsters');

    expect(result[0].path).toBe('en/monsters/goblin.sheet.mdx');
  });

  it('constructs directory path as locale/name when called from root', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi
        .fn()
        .mockResolvedValueOnce([{ name: 'monsters', isDirectory: true }])
        .mockResolvedValueOnce([]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result[0].path).toBe('en/monsters');
  });

  it('excludes node_modules directories', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: 'node_modules', isDirectory: true },
        { name: 'valid.mdx', isDirectory: false },
      ]),
    };

    const result = await buildContentTree(adapter, 'en');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('valid.mdx');
  });
});

describe('listContentTree', () => {
  it('returns an array using the resolved adapter', async () => {
    const { listContentTree } =
      await import('@/lib/db/content/contentTreeService');
    const result = await listContentTree('en');
    expect(Array.isArray(result)).toBe(true);
  });
});
