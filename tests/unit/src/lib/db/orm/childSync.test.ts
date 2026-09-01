/**
 * @fileoverview Child Sync Contract Unit Tests
 * @description Tests the narrowing guard that decides whether an entity class
 * owns child rows.
 *
 * @module tests/unit/src/lib/db/orm/childSync.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { describe, expect, it, vi } from 'vitest';

import {
  hasChildSync,
  type ChildSyncContext,
  type ChildSyncing,
} from '@/lib/db/orm/childSync';

class WithSync {
  static syncChildren(): void {}
}

class WithoutSync {}

class SyncNotCallable {
  static syncChildren = 'nope';
}

describe('hasChildSync', () => {
  it('accepts a class declaring the static', () => {
    expect(hasChildSync(WithSync)).toBe(true);
  });

  it('rejects a class without the static', () => {
    expect(hasChildSync(WithoutSync)).toBe(false);
  });

  it('rejects a class whose static is not callable', () => {
    expect(hasChildSync(SyncNotCallable)).toBe(false);
  });

  it('rejects a plain object carrying the property', () => {
    expect(hasChildSync({ syncChildren: () => {} })).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'WithSync'],
    ['a number', 7],
  ])('rejects %s', (_label, value) => {
    expect(hasChildSync(value)).toBe(false);
  });

  it('accepts a bare function declaring the static', () => {
    const factory = (): void => {};
    (factory as unknown as ChildSyncing).syncChildren = () => {};

    expect(hasChildSync(factory)).toBe(true);
  });

  it('narrows so the caller can invoke syncChildren', () => {
    const syncChildren = vi.fn();
    class Owner {
      static syncChildren = syncChildren;
    }

    const ctx: ChildSyncContext = {
      init: () => ({}),
      create: () => ({}),
    };
    const parent = { id: 1 };
    const record = { slug: 'blessed-wind' };

    const candidate: unknown = Owner;
    if (!hasChildSync(candidate)) throw new Error('guard rejected the owner');

    candidate.syncChildren(ctx, parent, record);

    expect(syncChildren).toHaveBeenCalledWith(ctx, parent, record);
  });
});
