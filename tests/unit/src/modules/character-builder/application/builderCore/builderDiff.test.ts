/**
 * @fileoverview builderDiff tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderDiff.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  diffFlags,
  diffJson,
} from '@/modules/character-builder/application/builderCore/builderDiff';
import type { BuilderFlag } from '@/modules/character-builder/application/builderCore/types';
import { describe, expect, it } from 'vitest';

const flag = (code: BuilderFlag['code'], amount = 1): BuilderFlag => ({
  code,
  severity: 'warning',
  messageKey: 'k',
  params: { amount },
  message: `m${amount}`,
  source: { kind: 'boons', features: [] },
});

describe('diffJson', () => {
  it('returns nothing for equal values', () => {
    expect(diffJson({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toEqual([]);
  });

  it('lists changed, added, and removed leaves with paths', () => {
    expect(
      diffJson({ a: { b: 1 }, list: [1, 2], gone: true }, { a: { b: 2 }, list: [1], add: 'x' }),
    ).toEqual([
      { path: 'a.b', before: 1, after: 2 },
      { path: 'list[1]', before: 2, after: undefined },
      { path: 'gone', before: true, after: undefined },
      { path: 'add', before: undefined, after: 'x' },
    ]);
  });
});

describe('diffFlags', () => {
  it('splits added, removed, and changed', () => {
    const result = diffFlags(
      [flag('BP_OVER_BUDGET', 1), flag('UNASSIGNED_LEVELS')],
      [flag('BP_OVER_BUDGET', 2), flag('UNASSIGNED_FEAT')],
    );
    expect(result.added.map((f) => f.code)).toEqual(['UNASSIGNED_FEAT']);
    expect(result.removed.map((f) => f.code)).toEqual(['UNASSIGNED_LEVELS']);
    expect(result.changed.map((f) => f.params.amount)).toEqual([2]);
  });
});
