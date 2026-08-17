/**
 * @fileoverview aspectRollup Tests
 * @description Roll-up counts, available aspects and AND filtering.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/aspectRollup
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  availableAspects,
  matchesAspects,
  rollUpAspects,
} from '@/modules/character-builder/lib/utils/aspectRollup';
import { describe, expect, it } from 'vitest';

describe('rollUpAspects', () => {
  it('should count each aspect once per shard, most frequent first', () => {
    const out = rollUpAspects([
      ['damage:fire', 'damage:fire', 'tempo:reactive'],
      ['damage:fire'],
      undefined,
    ]);
    expect(out).toEqual([
      { aspect: 'damage:fire', count: 2 },
      { aspect: 'tempo:reactive', count: 1 },
    ]);
  });

  it('should drop internal and malformed tokens', () => {
    const out = rollUpAspects([['meta:x', 'nonsense', 'damage:frost']]);
    expect(out.map((c) => c.aspect)).toEqual(['damage:frost']);
  });
});

describe('availableAspects', () => {
  it('should list distinct aspects in vocabulary order', () => {
    const out = availableAspects([
      ['tempo:major', 'damage:fire'],
      ['damage:fire'],
    ]);
    expect(out).toEqual(['damage:fire', 'tempo:major']);
  });
});

describe('matchesAspects', () => {
  it('should match everything on an empty selection', () => {
    expect(matchesAspects(undefined, new Set())).toBe(true);
  });

  it('should require every selected aspect', () => {
    const sel = new Set(['damage:fire', 'tempo:reactive']);
    expect(matchesAspects(['damage:fire', 'tempo:reactive', 'x:y'], sel)).toBe(
      true,
    );
    expect(matchesAspects(['damage:fire'], sel)).toBe(false);
    expect(matchesAspects(undefined, sel)).toBe(false);
  });
});
