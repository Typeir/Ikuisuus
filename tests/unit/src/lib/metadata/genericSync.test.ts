/**
 * @fileoverview Generic Sync Unit Tests
 * @description Tests definition-driven upserts, hash diffing, deletion, natural
 * keys, and child-row statics.
 *
 * @module tests/unit/src/lib/metadata/genericSync.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { ReferenceKind } from '@mikro-orm/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { syncTable, type SyncTarget } from '@/lib/metadata/genericSync';

class RowEntity {}
class ChildEntity {}

/** Property metadata the reflection mapper reads. */
const PROPERTIES = {
  id: { name: 'id', primary: true, kind: ReferenceKind.SCALAR, type: 'number' },
  locale: { name: 'locale', kind: ReferenceKind.SCALAR, type: 'string' },
  slug: { name: 'slug', kind: ReferenceKind.SCALAR, type: 'string' },
  title: { name: 'title', kind: ReferenceKind.SCALAR, type: 'string' },
  subSlug: { name: 'subSlug', kind: ReferenceKind.SCALAR, type: 'string' },
  consumers: { name: 'consumers', kind: ReferenceKind.SCALAR, type: 'string[]' },
  versionHash: {
    name: 'versionHash',
    kind: ReferenceKind.SCALAR,
    type: 'string',
  },
  kids: { name: 'kids', kind: ReferenceKind.ONE_TO_MANY, type: 'ChildEntity' },
};

const CHILD_PROPERTIES = {
  id: { name: 'id', primary: true, kind: ReferenceKind.SCALAR, type: 'number' },
  name: { name: 'name', kind: ReferenceKind.SCALAR, type: 'string' },
  sortOrder: { name: 'sortOrder', kind: ReferenceKind.SCALAR, type: 'number' },
};

/**
 * Builds an entity-manager double with ORM metadata for both classes.
 *
 * @param {object[]} existing - Rows already in the table
 * @returns {object} Mock entity manager
 */
function makeEm(existing: Array<Record<string, unknown>> = []) {
  return {
    getMetadata: () => ({
      get: (name: string) => ({
        properties: name === 'ChildEntity' ? CHILD_PROPERTIES : PROPERTIES,
      }),
    }),
    find: vi.fn().mockResolvedValue(existing),
    assign: vi.fn((entity, data) => Object.assign(entity, data)),
    create: vi.fn((_cls, data) => ({ ...data })),
    remove: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Builds a sync target over the fake entity.
 *
 * @param {Record<string, unknown>[]} records - Records the target yields
 * @param {Partial<SyncTarget>} [extra] - Target overrides
 * @returns {SyncTarget} Target under test
 */
function makeTarget(
  records: Array<Record<string, unknown>>,
  extra: Partial<SyncTarget> = {},
): SyncTarget {
  return {
    entityClass: RowEntity as never,
    subdir: 'things',
    readRecords: () => ({ records, sourceExists: true }),
    ...extra,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  delete (RowEntity as Record<string, unknown>).syncChildren;
});

describe('syncTable', () => {
  it('returns empty stats when the source directory is missing', async () => {
    const em = makeEm();
    const target = makeTarget([], {
      readRecords: () => ({ records: [], sourceExists: false }),
    });

    const result = await syncTable(em as never, 'en', target);

    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 0, deleted: 0 });
    expect(em.find).not.toHaveBeenCalled();
  });

  it('inserts a row that does not exist', async () => {
    const em = makeEm();
    const target = makeTarget([{ slug: 'a', title: 'A', versionHash: 'h1' }]);

    const result = await syncTable(em as never, 'en', target);

    expect(result.inserted).toBe(1);
    expect(em.create).toHaveBeenCalledTimes(1);
    expect(em.create.mock.calls[0][1]).toMatchObject({
      slug: 'a',
      title: 'A',
      locale: 'en',
    });
  });

  it('skips a row whose hash is unchanged', async () => {
    const em = makeEm([{ slug: 'a', versionHash: 'h1' }]);
    const target = makeTarget([{ slug: 'a', title: 'A', versionHash: 'h1' }]);

    const result = await syncTable(em as never, 'en', target);

    expect(result).toMatchObject({ skipped: 1, updated: 0, inserted: 0 });
    expect(em.assign).not.toHaveBeenCalled();
  });

  it('updates a row whose hash changed', async () => {
    const em = makeEm([{ slug: 'a', versionHash: 'old', kids: { removeAll: vi.fn() } }]);
    const target = makeTarget([{ slug: 'a', title: 'A', versionHash: 'new' }]);

    const result = await syncTable(em as never, 'en', target);

    expect(result.updated).toBe(1);
    expect(em.assign).toHaveBeenCalledTimes(1);
  });

  it('never writes a key absent from the record', async () => {
    const em = makeEm();
    const target = makeTarget([{ slug: 'a', versionHash: 'h1' }]);

    await syncTable(em as never, 'en', target);

    expect(em.create.mock.calls[0][1]).not.toHaveProperty('consumers');
  });

  it('leaves consumers untouched on update', async () => {
    const existing = {
      slug: 'a',
      versionHash: 'old',
      consumers: ['rules/x'],
      kids: { removeAll: vi.fn() },
    };
    const em = makeEm([existing]);
    const target = makeTarget([{ slug: 'a', versionHash: 'new' }]);

    await syncTable(em as never, 'en', target);

    expect(existing.consumers).toEqual(['rules/x']);
  });

  it('clears collections before recreating children', async () => {
    const removeAll = vi.fn();
    const em = makeEm([{ slug: 'a', versionHash: 'old', kids: { removeAll } }]);
    const target = makeTarget([{ slug: 'a', versionHash: 'new' }]);

    await syncTable(em as never, 'en', target);

    expect(removeAll).toHaveBeenCalledTimes(1);
    expect(em.flush).toHaveBeenCalled();
  });

  it('calls syncChildren on insert when the static exists', async () => {
    const syncChildren = vi.fn();
    (RowEntity as Record<string, unknown>).syncChildren = syncChildren;
    const em = makeEm();
    const record = { slug: 'a', versionHash: 'h1', kids: [{ name: 'k' }] };

    await syncTable(em as never, 'en', makeTarget([record]));

    expect(syncChildren).toHaveBeenCalledTimes(1);
    expect(syncChildren.mock.calls[0][2]).toBe(record);
  });

  it('gives syncChildren a context that maps by child property metadata', async () => {
    let seen: Record<string, unknown> | undefined;
    (RowEntity as Record<string, unknown>).syncChildren = (
      ctx: { init: (c: unknown, r: Record<string, unknown>) => unknown },
    ) => {
      seen = ctx.init(ChildEntity as never, {
        name: 'k',
        sortOrder: 2,
        bogus: true,
      }) as Record<string, unknown>;
    };
    const em = makeEm();

    await syncTable(em as never, 'en', makeTarget([{ slug: 'a', versionHash: 'h' }]));

    expect(seen).toEqual({ name: 'k', sortOrder: 2 });
  });

  it('does not call syncChildren when the static is absent', async () => {
    const em = makeEm();
    const target = makeTarget([{ slug: 'a', versionHash: 'h1' }]);

    await expect(syncTable(em as never, 'en', target)).resolves.toMatchObject({
      inserted: 1,
    });
  });

  it('identifies rows by naturalKey when supplied', async () => {
    const em = makeEm([
      { slug: 'a', subSlug: 'a-1', versionHash: 'old', kids: { removeAll: vi.fn() } },
    ]);
    const target = makeTarget(
      [{ slug: 'a', subSlug: 'a-1', versionHash: 'new' }],
      { naturalKey: (row) => (row.subSlug as string) || (row.slug as string) },
    );

    const result = await syncTable(em as never, 'en', target);

    expect(result).toMatchObject({ updated: 1, inserted: 0 });
  });

  it('deletes stale rows only when deletion is allowed', async () => {
    const em = makeEm([{ slug: 'gone', versionHash: 'h' }]);
    const target = makeTarget([{ slug: 'a', versionHash: 'h1' }]);

    const kept = await syncTable(em as never, 'en', target);
    expect(kept.deleted).toBe(0);
    expect(em.remove).not.toHaveBeenCalled();

    const em2 = makeEm([{ slug: 'gone', versionHash: 'h' }]);
    const removed = await syncTable(em2 as never, 'en', target, {
      allowDeletion: true,
    });
    expect(removed.deleted).toBe(1);
    expect(em2.remove).toHaveBeenCalledTimes(1);
  });

  it('uses supplied records instead of reading from disk', async () => {
    const em = makeEm();
    const readRecords = vi.fn();
    const target = makeTarget([], { readRecords });

    const result = await syncTable(em as never, 'en', target, {
      records: [{ slug: 'a', versionHash: 'h1' }],
    });

    expect(readRecords).not.toHaveBeenCalled();
    expect(result.inserted).toBe(1);
  });
});
