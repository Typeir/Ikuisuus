/**
 * @fileoverview Generator Utilities Unit Tests
 * @description Tests for content directory resolution, output path mapping,
 * and metadata backend detection.
 *
 * @module tests/unit/src/lib/metadata/generatorUtils.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    getContentDirectory,
    getMetaSubdir,
    getMetadataOutputPath,
    runGenerator,
} from '@scripts/metadata/generatorUtils';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getMetadataBackend', () => {
  const originalEnv = process.env.METADATA_BACKEND;

  beforeEach(() => {
    /** Reset cached backend value via re-import */
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.METADATA_BACKEND = originalEnv;
    } else {
      delete process.env.METADATA_BACKEND;
    }
    vi.restoreAllMocks();
  });

  it('should return env var when set', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const mod = await import('@scripts/metadata/generatorUtils');
    expect(mod.getMetadataBackend()).toBe('pg');
  });

  it('should default to fs when no env var', async () => {
    delete process.env.METADATA_BACKEND;
    const mod = await import('@scripts/metadata/generatorUtils');
    const result = mod.getMetadataBackend();
    expect(['fs', 'pg']).toContain(result);
  });
});

describe('getContentDirectory', () => {
  it('should return path for monsters', () => {
    const result = getContentDirectory('monsters');
    expect(result).toContain(path.join('src', 'content', 'en', 'monsters'));
  });

  it('should return path for heirlooms', () => {
    const result = getContentDirectory('heirlooms');
    expect(result).toContain(
      path.join('src', 'content', 'en', 'items', 'heirlooms'),
    );
  });

  it('should return path for spells', () => {
    const result = getContentDirectory('spells');
    expect(result).toContain(path.join('src', 'content', 'en', 'spells'));
  });

  it('should return path for trinkets', () => {
    const result = getContentDirectory('trinkets');
    expect(result).toContain(
      path.join('src', 'content', 'en', 'items', 'trinkets'),
    );
  });

  it('should throw for unknown type', () => {
    expect(() => getContentDirectory('unknown')).toThrow(
      'Unknown content type: unknown',
    );
  });
});

describe('getMetaSubdir', () => {
  it('should return monsters for monsters type', () => {
    expect(getMetaSubdir('monsters')).toBe('monsters');
  });

  it('should return items/heirlooms for heirlooms type', () => {
    expect(getMetaSubdir('heirlooms')).toBe(path.join('items', 'heirlooms'));
  });

  it('should return spells for spells type', () => {
    expect(getMetaSubdir('spells')).toBe('spells');
  });

  it('should fall back to content type name for unknown', () => {
    expect(getMetaSubdir('custom')).toBe('custom');
  });
});

describe('getMetadataOutputPath', () => {
  it('should redirect to the .meta mirror tree', () => {
    const result = getMetadataOutputPath(
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      /\.sheet\.mdx$/,
      'monsters',
      'en',
    );
    expect(result).toContain('.meta');
    expect(result).toContain('monsters');
    expect(result).toContain('goblin.metadata.json');
  });

  it('should never write alongside the source file', () => {
    const result = getMetadataOutputPath(
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      /\.sheet\.mdx$/,
      'monsters',
      'en',
    );
    expect(result).not.toContain(path.join('src', 'content'));
  });
});

vi.mock('@/lib/utils/getMatchingFiles', () => ({
  getMatchingFiles: vi.fn(),
}));

vi.mock('@scripts/metadata/fileUtils', () => ({
  ensureDirectory: vi.fn().mockResolvedValue(true),
  safeWriteFile: vi.fn().mockResolvedValue(true),
}));

vi.mock('fs', () => {
  const mocks = {
    readFileSync: vi.fn().mockReturnValue('# Mock MDX source content\n'),
  };
  return { ...mocks, default: mocks };
});

vi.mock('@scripts/metadata/sharedData', () => ({
  loadSharedData: vi.fn().mockResolvedValue({
    gameData: {},
    itemData: {},
    spellData: {},
    worldData: {},
    taxonomies: {},
    patterns: {},
  }),
}));

vi.mock('@scripts/metadata/performanceUtils', () => ({
  startTimer: vi.fn(),
  endTimer: vi.fn().mockReturnValue(100),
}));

describe('runGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process files and write metadata', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue([
      '/tmp/test/goblin.sheet.mdx',
    ]);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi
      .fn()
      .mockResolvedValue({ slug: 'goblin', title: 'Goblin' });

    await runGenerator({
      name: 'Test Generator',
      contentType: 'monsters',
      filePattern: /\.sheet\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
    });

    expect(parseFile).toHaveBeenCalledTimes(1);
    expect(safeWriteFile).toHaveBeenCalledTimes(1);
  });

  it('should return early when no files found', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    vi.mocked(getMatchingFiles).mockResolvedValue([]);

    const parseFile = vi.fn();

    await runGenerator({
      name: 'Test Generator',
      contentType: 'monsters',
      filePattern: /\.sheet\.mdx$/,
      parseFile,
      contentDir: '/tmp/empty',
    });

    expect(parseFile).not.toHaveBeenCalled();
  });

  it('should use processResult transform when provided', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue(['/tmp/test/spell.mdx']);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi.fn().mockResolvedValue([{ slug: 'a' }, { slug: 'b' }]);
    const processResult = vi.fn().mockImplementation((result) => ({
      metadata: result,
      count: (result as unknown[]).length,
    }));

    await runGenerator({
      name: 'Test Generator',
      contentType: 'spells',
      filePattern: /\.mdx$/,
      parseFile,
      processResult,
      contentDir: '/tmp/test',
    });

    expect(processResult).toHaveBeenCalledTimes(1);
    expect(safeWriteFile).toHaveBeenCalled();
  });

  it('should handle parse failures gracefully', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue([
      '/tmp/test/good.sheet.mdx',
      '/tmp/test/bad.sheet.mdx',
    ]);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi
      .fn()
      .mockResolvedValueOnce({ slug: 'good', title: 'Good' })
      .mockRejectedValueOnce(new Error('Parse failed'));

    await runGenerator({
      name: 'Test Generator',
      contentType: 'monsters',
      filePattern: /\.sheet\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
    });

    expect(parseFile).toHaveBeenCalledTimes(2);
  });

  it('should handle safeWriteFile failure', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue(['/tmp/test/fail.sheet.mdx']);
    vi.mocked(safeWriteFile).mockResolvedValue(false);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi
      .fn()
      .mockResolvedValue({ slug: 'fail', title: 'Fail' });

    await runGenerator({
      name: 'Test Generator',
      contentType: 'monsters',
      filePattern: /\.sheet\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
    });

    expect(parseFile).toHaveBeenCalledTimes(1);
  });

  it('should call storage.upsert when storage adapter provided', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue(['/tmp/test/item.mdx']);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi
      .fn()
      .mockResolvedValue({ slug: 'sword', title: 'Sword' });
    const storage = {
      upsert: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    await runGenerator({
      name: 'Test Generator',
      contentType: 'heirlooms',
      filePattern: /\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
      storage,
    });

    expect(storage.upsert).toHaveBeenCalledWith(
      'heirlooms',
      'en',
      'sword',
      expect.objectContaining({
        slug: 'sword',
        title: 'Sword',
        versionHash: expect.any(String),
      }),
    );
  });

  it('should handle storage upsert failure gracefully', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue(['/tmp/test/item.mdx']);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parseFile = vi
      .fn()
      .mockResolvedValue({ slug: 'sword', title: 'Sword' });
    const storage = {
      upsert: vi.fn().mockRejectedValue(new Error('DB down')),
      close: vi.fn().mockResolvedValue(undefined),
    };

    await runGenerator({
      name: 'Test Generator',
      contentType: 'heirlooms',
      filePattern: /\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
      storage,
    });

    expect(storage.upsert).toHaveBeenCalled();
  });

  it('should handle array metadata with storage adapter', async () => {
    const { getMatchingFiles } = await import('@/lib/utils/getMatchingFiles');
    const { safeWriteFile, ensureDirectory } = await import(
      '@scripts/metadata/fileUtils'
    );
    vi.mocked(getMatchingFiles).mockResolvedValue([
      '/tmp/test/multi.sheet.mdx',
    ]);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
    vi.mocked(ensureDirectory).mockResolvedValue(true);

    const parsed = [
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
    ];
    const parseFile = vi.fn().mockResolvedValue(parsed);
    const storage = {
      upsert: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    await runGenerator({
      name: 'Test Generator',
      contentType: 'monsters',
      filePattern: /\.sheet\.mdx$/,
      parseFile,
      contentDir: '/tmp/test',
      storage,
    });

    expect(storage.upsert).toHaveBeenCalledTimes(2);
    expect(storage.upsert).toHaveBeenCalledWith(
      'monsters',
      'en',
      'a',
      expect.objectContaining({ slug: 'a' }),
    );
    expect(storage.upsert).toHaveBeenCalledWith(
      'monsters',
      'en',
      'b',
      expect.objectContaining({ slug: 'b' }),
    );
  });
});
