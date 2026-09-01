/**
 * @fileoverview Directory Walker Unit Tests
 * @description Tests matching, main.mdx exclusion, recursion, and error
 * swallowing with mocked fs.
 *
 * @module tests/unit/src/lib/utils/getMatchingFiles.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
  },
}));

import {
  getMatchingFiles,
  walkDirectory,
} from '@/lib/utils/getMatchingFiles';

let fsMock: { readdir: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  const fs = await import('fs/promises');
  fsMock = fs.default as unknown as typeof fsMock;
  fsMock.readdir.mockReset();
});

describe('getMatchingFiles', () => {
  it('should return matching files', async () => {
    fsMock.readdir.mockResolvedValue([
      { name: 'goblin.sheet.mdx', isFile: () => true },
      { name: 'dragon.sheet.mdx', isFile: () => true },
      { name: 'main.mdx', isFile: () => true },
      { name: 'subdir', isFile: () => false },
    ]);

    const result = await getMatchingFiles('/content', /\.sheet\.mdx$/);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('goblin.sheet.mdx');
    expect(result[1]).toContain('dragon.sheet.mdx');
  });

  it('should exclude main.mdx in non-recursive mode', async () => {
    fsMock.readdir.mockResolvedValue([{ name: 'main.mdx', isFile: () => true }]);

    const result = await getMatchingFiles('/content', /\.mdx$/);
    expect(result).toEqual([]);
  });

  it('should walk subdirectories in recursive mode', async () => {
    fsMock.readdir.mockImplementation((dir: string) =>
      Promise.resolve(
        String(dir).endsWith('nested')
          ? [
              {
                name: 'deep.mdx',
                isFile: () => true,
                isDirectory: () => false,
              },
            ]
          : [
              {
                name: 'top.mdx',
                isFile: () => true,
                isDirectory: () => false,
              },
              {
                name: 'nested',
                isFile: () => false,
                isDirectory: () => true,
              },
            ],
      ),
    );

    const result = await getMatchingFiles('/content', /\.mdx$/, true);
    expect(result).toHaveLength(2);
    expect(result.some((p) => p.includes('deep.mdx'))).toBe(true);
  });

  it('should return empty array on error', async () => {
    fsMock.readdir.mockRejectedValue(new Error('ENOENT'));
    const result = await getMatchingFiles('/missing', /\.mdx$/);
    expect(result).toEqual([]);
  });
});

describe('walkDirectory', () => {
  it('should swallow unreadable directories', async () => {
    fsMock.readdir.mockRejectedValue(new Error('EACCES'));
    const results: string[] = [];
    await walkDirectory('/forbidden', /\.mdx$/, results);
    expect(results).toEqual([]);
  });
});
