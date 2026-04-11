/**
 * FS Content Source Adapter Unit Tests
 *
 * @fileoverview Verifies exact-path and semantic-suffix fallback resolution
 * behavior for the filesystem content source adapter.
 * @module tests/unit/src/lib/db/content/adapters/fs/fsContentSource.test
 * @author Typeir
 * @version 3.1.0
 * @since 1.0.0
 */

import { fsContentSource } from '@/lib/db/content/adapters/fs/fsContentSource';
import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const accessMock = vi.hoisted(() => vi.fn());
const readFileMock = vi.hoisted(() => vi.fn());
const readdirMock = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
  default: {
    access: accessMock,
    readFile: readFileMock,
    readdir: readdirMock,
  },
  access: accessMock,
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

  it('returns exact file when direct slug exists', async () => {
    vi.mocked(fs.access).mockImplementation(async (targetPath: any) => {
      if (String(targetPath).endsWith('battle-master.mdx')) {
        return;
      }
      throw new Error('ENOENT');
    });
    vi.mocked(fs.readFile).mockResolvedValue('# exact file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'character-creation/vocations/fighter/battle-master.mdx',
    );

    expect(result).toEqual({
      content: '# exact file',
      resolvedPath: expectedPath,
    });
    expect(fs.readdir).not.toHaveBeenCalled();
  });

  it('resolves unique semantic file when direct slug does not exist', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.specialization.mdx'),
      buildDirent('main.mdx'),
    ] as any);
    vi.mocked(fs.readFile).mockResolvedValue('# semantic file' as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    const expectedPath = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'character-creation/vocations/fighter',
      'battle-master.specialization.mdx',
    );

    expect(result).toEqual({
      content: '# semantic file',
      resolvedPath: expectedPath,
    });
  });

  it('returns null when semantic fallback is ambiguous', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.specialization.mdx'),
      buildDirent('battle-master.reference.mdx'),
    ] as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(result).toBeNull();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('returns null when only non-semantic sibling files exist', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.readdir).mockResolvedValue([
      buildDirent('battle-master.notes.mdx'),
    ] as any);

    const result = await fsContentSource.fetch(
      'en',
      'character-creation/vocations/fighter/battle-master',
    );

    expect(result).toBeNull();
  });

  it('resolves .heirloom.mdx semantic fallback', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
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

  it('resolves .trinket.mdx semantic fallback', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
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
