/**
 * @fileoverview Unit Tests — fsDirectorySource
 * @description Validates filesystem-based directory listing, including handling
 * of missing paths, non-directory paths, and populated directories.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsDirectorySource
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('fs');

import fs from 'fs';

import { fsDirectorySource } from '@/lib/db/content/adapters/fs/fsDirectorySource';

describe('fsDirectorySource', () => {
  beforeEach(() => {
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as ReturnType<typeof fs.statSync>);

    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'monsters', isDirectory: () => true } as unknown as fs.Dirent,
      {
        name: 'goblin.sheet.mdx',
        isDirectory: () => false,
      } as unknown as fs.Dirent,
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns directory entries from the filesystem', async () => {
    const entries = await fsDirectorySource.listEntries('en', '');

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ name: 'monsters', isDirectory: true });
    expect(entries[1]).toEqual({
      name: 'goblin.sheet.mdx',
      isDirectory: false,
    });
  });

  it('returns empty array when the directory does not exist', async () => {
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const entries = await fsDirectorySource.listEntries('en', 'nonexistent');

    expect(entries).toEqual([]);
  });

  it('returns empty array when the path is not a directory', async () => {
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as ReturnType<typeof fs.statSync>);

    const entries = await fsDirectorySource.listEntries('en', 'some-file.mdx');

    expect(entries).toEqual([]);
  });

  it('returns empty array for an empty directory', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    const entries = await fsDirectorySource.listEntries('en', 'empty-dir');

    expect(entries).toEqual([]);
  });

  it('maps each Dirent to the DirectoryEntry shape', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'spells', isDirectory: () => true } as unknown as fs.Dirent,
      {
        name: 'fireball.mdx',
        isDirectory: () => false,
      } as unknown as fs.Dirent,
    ]);

    const entries = await fsDirectorySource.listEntries('en', 'spells');

    expect(entries[0]).toEqual({ name: 'spells', isDirectory: true });
    expect(entries[1]).toEqual({ name: 'fireball.mdx', isDirectory: false });
  });
});
