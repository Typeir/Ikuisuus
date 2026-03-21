/**
 * readMetadataFiles Unit Tests
 *
 * @fileoverview Tests for the generic filesystem metadata reader utility.
 *
 * @module tests/unit/lib/db/content/adapters/fs/readMetadataFiles
 */

import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const existsSyncMock = vi.hoisted(() => vi.fn());
const readdirSyncMock = vi.hoisted(() => vi.fn());
const readFileSyncMock = vi.hoisted(() => vi.fn());
const getContentFolderMock = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({
  default: {
    existsSync: existsSyncMock,
    readdirSync: readdirSyncMock,
    readFileSync: readFileSyncMock,
  },
  existsSync: existsSyncMock,
  readdirSync: readdirSyncMock,
  readFileSync: readFileSyncMock,
}));

vi.mock('@/lib/utils/getContentFolder', () => ({
  getContentFolder: getContentFolderMock,
}));

let readMetadataFiles: typeof import('@/lib/db/content/adapters/fs/readMetadataFiles').readMetadataFiles;
let fs: typeof import('fs');
let getContentFolder: Mock;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  fs = await import('fs');
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
  it('should return empty array when directory does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = readMetadataFiles('en', 'monsters');

    expect(result).toEqual([]);
  });

  it('should read and parse .metadata.json files', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      'aboleth.metadata.json',
      'readme.txt',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ slug: 'aboleth', title: 'Aboleth' }),
    );

    const result = readMetadataFiles('en', 'monsters');

    expect(result).toEqual([{ slug: 'aboleth', title: 'Aboleth' }]);
  });

  it('should flatten array entries in metadata files', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      'multi.metadata.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify([
        { slug: 'a', title: 'A' },
        { slug: 'b', title: 'B' },
      ]),
    );

    const result = readMetadataFiles('en', 'monsters');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ slug: 'a', title: 'A' });
    expect(result[1]).toEqual({ slug: 'b', title: 'B' });
  });

  it('should skip non-metadata files', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      'file.mdx',
      'notes.json',
      'data.metadata.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ slug: 'data' }),
    );

    const result = readMetadataFiles('en', 'spells');

    expect(result).toEqual([{ slug: 'data' }]);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should construct path using getContentFolder', () => {
    getContentFolder.mockReturnValue('/project/src/content/es');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    readMetadataFiles('es', 'items/heirlooms');

    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('items'),
    );
  });

  it('should skip .meta/ directory when METADATA_BACKEND is fs', () => {
    vi.stubEnv('METADATA_BACKEND', 'fs');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      'fireball.metadata.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ slug: 'fireball' }),
    );

    readMetadataFiles('en', 'spells');

    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('content'),
    );
  });

  it('should prefer .meta/ directory when METADATA_BACKEND is pg', () => {
    vi.stubEnv('METADATA_BACKEND', 'pg');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      'fireball.metadata.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ slug: 'fireball' }),
    );

    readMetadataFiles('en', 'spells');

    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('.meta'),
    );
  });
});
