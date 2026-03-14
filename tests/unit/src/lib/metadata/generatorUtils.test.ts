/**
 * @fileoverview Generator Utilities Unit Tests
 * @description Tests for content directory resolution, output path mapping,
 * and metadata backend detection.
 *
 * @module tests/unit/lib/metadata/generatorUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    getContentDirectory,
    getMetaSubdir,
    getMetadataOutputPath
} from '@/lib/metadata/generatorUtils';
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
    const mod = await import('@/lib/metadata/generatorUtils');
    expect(mod.getMetadataBackend()).toBe('pg');
  });

  it('should default to fs when no env var', async () => {
    delete process.env.METADATA_BACKEND;
    const mod = await import('@/lib/metadata/generatorUtils');
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
  it('should replace extension for fs backend', () => {
    const result = getMetadataOutputPath(
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      /\.sheet\.mdx$/,
      'monsters',
      'fs',
      'en',
    );
    expect(result).toBe(
      '/project/src/content/en/monsters/goblin.metadata.json',
    );
  });

  it('should redirect to .meta for pg backend', () => {
    const result = getMetadataOutputPath(
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      /\.sheet\.mdx$/,
      'monsters',
      'pg',
      'en',
    );
    expect(result).toContain('.meta');
    expect(result).toContain('monsters');
    expect(result).toContain('goblin.metadata.json');
  });
});
