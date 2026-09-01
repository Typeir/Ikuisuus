/**
 * @fileoverview Aspect Filter Tests
 * @description Covers the translation from `?aspect=` parameters into Pagefind
 * filters. Filter keys must match those written into the index.
 *
 * @module tests/unit/src/modules/search/domain/aspectFilters.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 *
 * @requires vitest Testing framework
 */

import {
  aspectsToFilters,
  filtersToAspects,
  hasFilters,
} from '@/modules/search/domain/aspectFilters';
import { describe, expect, it } from 'vitest';

describe('aspectsToFilters', () => {
  it('should key a plain aspect by its group', () => {
    expect(aspectsToFilters(['damage:fire'])).toEqual({ damage: ['fire'] });
  });

  /** The index stores `meta:source` with the colon flattened to `meta-source`. */
  it('should flatten an internal aspect to the key the index uses', () => {
    expect(aspectsToFilters(['meta:source:ikuisuus'])).toEqual({
      'meta-source': ['ikuisuus'],
    });
  });

  it('should collect several values of one group into that group', () => {
    expect(aspectsToFilters(['damage:fire', 'damage:frost'])).toEqual({
      damage: ['fire', 'frost'],
    });
  });

  it('should keep separate groups apart, so adding an axis narrows', () => {
    expect(aspectsToFilters(['damage:fire', 'save:dex'])).toEqual({
      damage: ['fire'],
      save: ['dex'],
    });
  });

  it('should not repeat a value asked for twice', () => {
    expect(aspectsToFilters(['damage:fire', 'damage:fire'])).toEqual({
      damage: ['fire'],
    });
  });

  it('should ignore parameters that are not aspects', () => {
    expect(aspectsToFilters(['damage', ':fire', 'damage:', ''])).toEqual({});
  });

  it('should tolerate surrounding whitespace', () => {
    expect(aspectsToFilters([' damage:fire '])).toEqual({ damage: ['fire'] });
  });

  it('should handle a stratum like any other value', () => {
    expect(aspectsToFilters(['resistance:elemental'])).toEqual({
      resistance: ['elemental'],
    });
  });
});

describe('hasFilters', () => {
  it('should report nothing set for an empty map', () => {
    expect(hasFilters({})).toBe(false);
  });

  it('should report nothing set when a group carries no values', () => {
    expect(hasFilters({ damage: [] })).toBe(false);
  });

  it('should report something set when a group carries a value', () => {
    expect(hasFilters({ damage: ['fire'] })).toBe(true);
  });
});

describe('filtersToAspects', () => {
  /**
   * Each active filter renders a link that drops it; that link round-trips
   * through aspectsToFilters and back.
   */
  it('should restore the tokens the filters came from', () => {
    const aspects = ['damage:fire', 'damage:frost', 'meta:source:ikuisuus'];

    expect(filtersToAspects(aspectsToFilters(aspects)).sort()).toEqual(
      [...aspects].sort(),
    );
  });
});
