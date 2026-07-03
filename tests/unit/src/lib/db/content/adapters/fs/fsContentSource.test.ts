/**
 * FS Content Source Adapter Unit Tests
 *
 * @fileoverview Verifies directory-listing-based resolution behavior for the
 * filesystem content source adapter.
 * @module tests/unit/src/lib/db/content/adapters/fs/fsContentSource.test
 * @author Typeir
 * @version 4.0.0
 * @since 1.0.0
 */

import { fsContentSource } from '@/lib/db/content/adapters/fs/fsContentSource';
import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFileMock = vi.hoisted(() => vi.fn());
const readdirMock = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
  default: {
    readFile: readFileMock,
    readdir: readdirMock,
  },
  readFile: readFileMock,
  readdir: readdirMock,
}));

type MockDirent = {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
};

const buildDirent = (name: string, isDirectory = false): MockDirent => ({
  name,
  isFile: () => !isDirectory,
  isDirectory: () => isDirectory,
});

describe('fsContentSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves exact slug filename from directory listing', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.mdx'),
      buildDirent('main.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# exact file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'character-creation/vocations/Warrior',
      'battle-master.mdx',
    );

    expect(result).toEqual({
      content: '# exact file',
      resolvedPath: expectedPath,
    });
  });

  it('resolves semantic suffix file from directory listing', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.specialization.mdx'),
      buildDirent('main.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# semantic file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'character-creation/vocations/Warrior',
      'battle-master.specialization.mdx',
    );

    expect(result).toEqual({
      content: '# semantic file',
      resolvedPath: expectedPath,
    });
  });

  it('returns first matching file when multiple matches exist', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.specialization.mdx'),
      buildDirent('battle-master.reference.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# first match' as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'character-creation/vocations/Warrior',
      'battle-master.specialization.mdx',
    );

    expect(result).toEqual({
      content: '# first match',
      resolvedPath: expectedPath,
    });
  });

  it('returns null when no matching file exists', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('main.mdx'),
      buildDirent('other-file.mdx'),
    ] as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(result).toBeNull();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('returns null when directory does not exist', async () => {
    vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT'));

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/Warrior/battle-master',
    );

    expect(result).toBeNull();
  });

  it('resolves .heirloom.mdx file', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('sundered-chain.heirloom.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# heirloom file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'items/heirlooms/sundered-chain',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'items/heirlooms',
      'sundered-chain.heirloom.mdx',
    );

    expect(result).toEqual({
      content: '# heirloom file',
      resolvedPath: expectedPath,
    });
  });

  it('resolves .trinket.mdx file', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('bone-coin.trinket.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# trinket file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'items/trinkets/bone-coin',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'items/trinkets',
      'bone-coin.trinket.mdx',
    );

    expect(result).toEqual({
      content: '# trinket file',
      resolvedPath: expectedPath,
    });
  });
});
