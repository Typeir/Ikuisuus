/**
 * @fileoverview Unit Tests — fileTreeService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const adapter = { listEntries: vi.fn() };

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: () => adapter,
}));

const fetchContentMock = vi.fn();
vi.mock('@/lib/utils/fetchContent', () => ({
  fetchContent: (...args: any[]) => fetchContentMock(...args),
}));

import {
    clearCache,
    getFile,
    listDirectory,
    statPath,
} from '@/lib/db/content/fileTreeService';

beforeEach(() => {
  adapter.listEntries.mockReset();
  fetchContentMock.mockReset();
  clearCache();
});

describe('fileTreeService.listDirectory', () => {
  it('paginates results and returns nextCursor', async () => {
    adapter.listEntries.mockResolvedValue([
      { name: 'a.mdx', isDirectory: false },
      { name: 'b.mdx', isDirectory: false },
      { name: 'c.mdx', isDirectory: false },
      { name: 'd.mdx', isDirectory: false },
      { name: 'e.mdx', isDirectory: false },
    ]);

    const res = await listDirectory('en', '', { limit: 2 });
    expect(res.entries).toHaveLength(2);
    expect(res.total).toBe(5);
    expect(res.nextCursor).toBeDefined();

    const next = await listDirectory('en', '', {
      cursor: res.nextCursor,
      limit: 2,
    });
    expect(next.entries).toHaveLength(2);
    expect(next.total).toBe(5);
  });

  it('uses cache for repeated calls', async () => {
    adapter.listEntries.mockResolvedValue([
      { name: 'x.mdx', isDirectory: false },
    ]);

    const a = await listDirectory('en', 'root', { limit: 10 });
    const b = await listDirectory('en', 'root', { limit: 10 });

    expect(a.entries).toEqual(b.entries);
    expect(adapter.listEntries).toHaveBeenCalledTimes(1);
  });
});

describe('fileTreeService.getFile', () => {
  it('normalizes path and delegates to fetchContent', async () => {
    fetchContentMock.mockResolvedValue({
      content: 'x',
      resolvedPath: 'src/content/en/items/foo.mdx',
    });

    const result = await getFile(
      'en',
      'src/content/en/items/alfanjon-of-the-crescent-moon.heirloom.mdx',
    );

    expect(fetchContentMock).toHaveBeenCalledWith(
      'en',
      'items/alfanjon-of-the-crescent-moon',
    );
    expect(result).toEqual({
      content: 'x',
      resolvedPath: 'src/content/en/items/foo.mdx',
    });
  });
});

describe('fileTreeService.statPath', () => {
  it('finds files by exact name under parent', async () => {
    adapter.listEntries.mockResolvedValueOnce([
      {
        name: 'alfanjon-of-the-crescent-moon.heirloom.mdx',
        isDirectory: false,
      },
    ]);

    const stat = await statPath(
      'en',
      'items/alfanjon-of-the-crescent-moon.heirloom.mdx',
    );

    expect(stat.exists).toBe(true);
    expect(stat.isFile).toBe(true);
    expect(stat.isDirectory).toBe(false);
  });
});
