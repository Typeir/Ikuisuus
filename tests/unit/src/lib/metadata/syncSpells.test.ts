/**
 * @fileoverview Unit tests for the spells metadata sync
 * @module tests/unit/src/lib/metadata/syncSpells.test
 * @description Validates hash-based skipping, the supplied-records path, and
 * that deletion stays opt-in and never removes seed-only rows.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/lib/metadata/syncSpells
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const readMock = vi.fn();

vi.mock('@/lib/metadata/metadataSource', () => ({
  readMetadataFiles: (...a: unknown[]) => readMock(...a),
}));

vi.mock('@/lib/db/orm/entities', () => ({
  SpellEntity: class SpellEntity {},
  SpellListEntity: class SpellListEntity {},
}));

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    message: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { syncSpells } from '@/lib/metadata/syncSpells';

/**
 * Builds a metadata record for one spell.
 *
 * @param {string} slug - Spell slug
 * @param {string} versionHash - Content hash
 * @returns {Record<string, unknown>} Spell metadata record
 */
const record = (slug: string, versionHash: string) => ({
  slug,
  title: slug,
  file: `src/content/en/spells/${slug}.spell.mdx`,
  link: `/library/spells/${slug}`,
  versionHash,
  spellLists: [],
});

/**
 * Builds a stub entity manager over a set of existing rows.
 *
 * @param {unknown[]} existing - Rows the manager should return from find
 * @returns {Record<string, ReturnType<typeof vi.fn>>} Stub manager
 */
const makeEm = (existing: unknown[] = []) => ({
  find: vi.fn().mockResolvedValue(existing),
  assign: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
  readMock.mockReset().mockReturnValue({ records: [], sourceExists: true });
});

describe('syncSpells', () => {
  it('inserts a record with no existing row', async () => {
    readMock.mockReturnValue({ records: [record('bane', 'h1')], sourceExists: true });
    const em = makeEm();

    const result = await syncSpells(em as never, 'en');

    expect(result.inserted).toBe(1);
    expect(result.deleted).toBe(0);
  });

  it('skips a record whose hash is unchanged', async () => {
    readMock.mockReturnValue({ records: [record('bane', 'h1')], sourceExists: true });
    const em = makeEm([
      { slug: 'bane', versionHash: 'h1', spellLists: { removeAll: vi.fn() } },
    ]);

    const result = await syncSpells(em as never, 'en');

    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
  });

  it('refuses to sync when the source directory is missing', async () => {
    readMock.mockReturnValue({ records: [], sourceExists: false });
    const em = makeEm();

    const result = await syncSpells(em as never, 'en');

    expect(em.find).not.toHaveBeenCalled();
    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 0, deleted: 0 });
  });

  it('syncs supplied records without reading sidecars', async () => {
    const em = makeEm();

    const result = await syncSpells(em as never, 'en', {
      records: [record('fetched', 'live')],
    });

    expect(readMock).not.toHaveBeenCalled();
    expect(result.inserted).toBe(1);
  });

  it('does not delete stale rows by default', async () => {
    readMock.mockReturnValue({ records: [record('bane', 'h1')], sourceExists: true });
    const em = makeEm([{ slug: 'gone', versionHash: 'old', source: 'Ikuisuus' }]);

    const result = await syncSpells(em as never, 'en');

    expect(result.deleted).toBe(0);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('deletes stale rows when deletion is allowed', async () => {
    readMock.mockReturnValue({ records: [record('bane', 'h1')], sourceExists: true });
    const stale = { slug: 'gone', versionHash: 'old', source: 'Ikuisuus' };
    const em = makeEm([stale]);

    const result = await syncSpells(em as never, 'en', { allowDeletion: true });

    expect(result.deleted).toBe(1);
    expect(em.remove).toHaveBeenCalledWith(stale);
  });

  it('deletes stale rows regardless of source', async () => {
    readMock.mockReturnValue({ records: [record('bane', 'h1')], sourceExists: true });
    const stale = { slug: 'retired', versionHash: 'old', source: 'Ikuisuus' };
    const em = makeEm([stale]);

    const result = await syncSpells(em as never, 'en', { allowDeletion: true });

    expect(result.deleted).toBe(1);
    expect(em.remove).toHaveBeenCalledWith(stale);
  });
});
