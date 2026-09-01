/**
 * @fileoverview Unit tests for the metadata sidecar reader
 * @module tests/unit/src/lib/metadata/metadataSource.test
 * @description Validates delegation to the fs adapter reader and the
 * source-presence flag that guards destructive reconciles.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/lib/metadata/metadataSource
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordsMock } = vi.hoisted(() => ({
  recordsMock: vi.fn(),
}));

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles', () => ({
  readMetadataFiles: recordsMock,
}));

import { readMetadataFiles } from '@/lib/metadata/metadataSource';

beforeEach(() => {
  recordsMock.mockReset();
});

describe('readMetadataFiles', () => {
  it('returns adapter records with the source flag set', async () => {
    recordsMock.mockResolvedValue([{ slug: 'bane' }]);

    const result = await readMetadataFiles('en', 'spells');

    expect(result).toEqual({
      records: [{ slug: 'bane' }],
      sourceExists: true,
    });
    expect(recordsMock).toHaveBeenCalledWith('en', 'spells');
  });

  it('reports no source when the adapter finds nothing', async () => {
    recordsMock.mockResolvedValue([]);

    expect(await readMetadataFiles('en', 'spells')).toEqual({
      records: [],
      sourceExists: false,
    });
  });
});
