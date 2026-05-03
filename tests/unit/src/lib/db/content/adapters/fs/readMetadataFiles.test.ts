/**
 * readMetadataFiles Unit Tests
 *
 * @fileoverview Tests for the generic filesystem metadata reader utility.
 *
 * @module tests/unit/lib/db/content/adapters/fs/readMetadataFiles
 */

import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const statMock = vi.hoisted(() => vi.fn());
const readdirMock = vi.hoisted(() => vi.fn());
const readFileMock = vi.hoisted(() => vi.fn());
const getContentFolderMock = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
  default: { stat: statMock, readdir: readdirMock, readFile: readFileMock },
  stat: statMock,
  readdir: readdirMock,
  readFile: readFileMock,
}));

vi.mock('@/lib/utils/getContentFolder', () => ({
  getContentFolder: getContentFolderMock,
}));

let readMetadataFiles: typeof import('@/lib/db/content/adapters/fs/readMetadataFiles').readMetadataFiles;
let fs: typeof import('fs/promises');
let getContentFolder: Mock;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  fs = await import('fs/promises');
  const gcf = await import('@/lib/utils/getContentFolder');
  getContentFolder = gcf.getContentFolder as Mock;
  getContentFolder.mockReturnValue('/content/en');

  const mod = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = mod.readMetadataFiles;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readMetadataFiles', () => {
  it('should return empty array when directory does not exist', async () => {
    vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

    const result = await readMetadataFiles('en', 'monsters');

    expect(result).toEqual([]);
  });

  it('should read and parse .metadata.json files', async () => {
    vi.mocked(fs.stat).mockResolvedValue({} as any);
    vi.mocked(fs.readdir).mockResolvedValue([
      'aboleth.metadata.json',
      'readme.txt',
    ] as unknown as string[]);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({ slug: 'aboleth', title: 'Aboleth' }),
    );

    const result = await readMetadataFiles('en', 'monsters');

    expect(result).toEqual([{ slug: 'aboleth', title: 'Aboleth' }]);
  });

  it('should flatten array entries in metadata files', async () => {
    vi.mocked(fs.stat).mockResolvedValue({} as any);
    vi.mocked(fs.readdir).mockResolvedValue([
      'multi.metadata.json',
    ] as unknown as string[]);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify([
        { slug: 'a', title: 'A' },
        { slug: 'b', title: 'B' },
      ]),
    );

    const result = await readMetadataFiles('en', 'monsters');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ slug: 'a', title: 'A' });
    expect(result[1]).toEqual({ slug: 'b', title: 'B' });
  });

  it('should skip non-metadata files', async () => {
    vi.mocked(fs.stat).mockResolvedValue({} as any);
    vi.mocked(fs.readdir).mockResolvedValue([
      'file.mdx',
      'notes.json',
      'data.metadata.json',
    ] as unknown as string[]);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ slug: 'data' }));

    const result = await readMetadataFiles('en', 'spells');

    expect(result).toEqual([{ slug: 'data' }]);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it('should construct path using getContentFolder', async () => {
    getContentFolder.mockReturnValue('/project/src/content/es');
    vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

    await readMetadataFiles('es', 'items/heirlooms');

    expect(fs.stat).toHaveBeenCalledWith(expect.stringContaining('items'));
  });

  it('should skip .meta/ directory when METADATA_BACKEND is fs', async () => {
    vi.stubEnv('METADATA_BACKEND', 'fs');
    vi.mocked(fs.stat).mockResolvedValue({} as any);
    vi.mocked(fs.readdir).mockResolvedValue([
      'fireball.metadata.json',
    ] as unknown as string[]);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({ slug: 'fireball' }),
    );

    await readMetadataFiles('en', 'spells');

    expect(fs.stat).toHaveBeenCalledTimes(1);
    expect(fs.stat).toHaveBeenCalledWith(expect.stringContaining('content'));
  });

  it('should prefer .meta/ directory when METADATA_BACKEND is pg', async () => {
    vi.stubEnv('METADATA_BACKEND', 'pg');
    vi.mocked(fs.stat).mockResolvedValue({} as any);
    vi.mocked(fs.readdir).mockResolvedValue([
      'fireball.metadata.json',
    ] as unknown as string[]);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({ slug: 'fireball' }),
    );

    await readMetadataFiles('en', 'spells');

    expect(fs.stat).toHaveBeenCalledWith(expect.stringContaining('.meta'));
  });
});
