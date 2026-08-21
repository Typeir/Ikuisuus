/**
 * @fileoverview Unit tests for the metadata sidecar reader
 * @module tests/unit/src/lib/metadata/metadataSource.test
 * @description Validates directory preference, the source-presence flag that
 * guards destructive reconciles, and record flattening.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/lib/metadata/metadataSource
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const fsMock = {
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
};

vi.mock('fs', () => {
  const api = {
    existsSync: (...a: unknown[]) => fsMock.existsSync(...a),
    readdirSync: (...a: unknown[]) => fsMock.readdirSync(...a),
    readFileSync: (...a: unknown[]) => fsMock.readFileSync(...a),
  };
  return { ...api, default: api };
});

import { readMetadataFiles } from '@/lib/metadata/metadataSource';

beforeEach(() => {
  fsMock.existsSync.mockReset();
  fsMock.readdirSync.mockReset().mockReturnValue([]);
  fsMock.readFileSync.mockReset().mockReturnValue('{}');
});

describe('readMetadataFiles', () => {
  it('prefers the .meta tree when it exists', () => {
    fsMock.existsSync.mockImplementation((p: string) => p.includes('.meta'));
    fsMock.readdirSync.mockReturnValue(['bane.metadata.json']);
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ slug: 'bane' }));

    const result = readMetadataFiles('en', 'spells');

    expect(result.sourceExists).toBe(true);
    expect(result.records).toEqual([{ slug: 'bane' }]);
    expect(String(fsMock.readdirSync.mock.calls[0][0])).toContain('.meta');
  });

  it('falls back to the content tree', () => {
    fsMock.existsSync.mockImplementation(
      (p: string) => !String(p).includes('.meta'),
    );
    fsMock.readdirSync.mockReturnValue(['bane.metadata.json']);
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ slug: 'bane' }));

    const result = readMetadataFiles('en', 'spells');

    expect(result.sourceExists).toBe(true);
    expect(String(fsMock.readdirSync.mock.calls[0][0])).toContain('content');
  });

  it('reports no source when neither directory exists', () => {
    fsMock.existsSync.mockReturnValue(false);

    expect(readMetadataFiles('en', 'spells')).toEqual({
      records: [],
      sourceExists: false,
    });
    expect(fsMock.readdirSync).not.toHaveBeenCalled();
  });

  it('reports no source when the directory holds no sidecars', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['bane.spell.mdx', 'README.md']);

    expect(readMetadataFiles('en', 'spells')).toEqual({
      records: [],
      sourceExists: false,
    });
  });

  it('flattens array sidecars into individual records', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['pack.metadata.json']);
    fsMock.readFileSync.mockReturnValue(
      JSON.stringify([{ slug: 'a' }, { slug: 'b' }]),
    );

    expect(readMetadataFiles('en', 'monsters').records).toEqual([
      { slug: 'a' },
      { slug: 'b' },
    ]);
  });

  it('ignores files that are not sidecars', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue([
      'bane.metadata.json',
      'bane.spell.mdx',
    ]);
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ slug: 'bane' }));

    expect(readMetadataFiles('en', 'spells').records).toHaveLength(1);
    expect(fsMock.readFileSync).toHaveBeenCalledTimes(1);
  });
});
