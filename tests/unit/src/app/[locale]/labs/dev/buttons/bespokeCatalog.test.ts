/**
 * @fileoverview Unit tests for bespoke button grouping and canonical matching.
 * @description Covers grouping of class uses by stylesheet and class, exclusion of
 * the canonical stylesheet, and nearest-variant scoring.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/bespokeCatalog.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/bespokeCatalog
 */

import {
  groupUses,
  nearestCanonical,
} from '@/app/[locale]/labs/dev/buttons/bespokeCatalog';
import { CANONICAL_STYLESHEET } from '@/app/[locale]/labs/dev/buttons/buttonCatalog';
import type { ButtonClassUse } from '@/app/[locale]/labs/dev/buttons/buttonInventory';
import { describe, expect, it } from 'vitest';

const USES: ButtonClassUse[] = [
  {
    tsx: 'src/modules/a/A.tsx',
    line: 10,
    stylesheet: 'C:/repo/src/modules/a/a.module.scss',
    className: 'removeBtn',
  },
  {
    tsx: 'src/modules/a/B.tsx',
    line: 20,
    stylesheet: 'C:/repo/src/modules/a/a.module.scss',
    className: 'removeBtn',
  },
  {
    tsx: 'src/modules/b/C.tsx',
    line: 5,
    stylesheet: 'C:/repo/src/modules/b/b.module.scss',
    className: 'removeBtn',
  },
  {
    tsx: 'src/modules/a/A.tsx',
    line: 12,
    stylesheet: CANONICAL_STYLESHEET,
    className: 'neutral',
  },
];

describe('groupUses', () => {
  it('groups uses of the same class in the same stylesheet', () => {
    const grouped = groupUses(USES);
    expect(
      grouped.get('C:/repo/src/modules/a/a.module.scss::removeBtn'),
    ).toHaveLength(2);
  });

  it('keeps same-named classes from different stylesheets apart', () => {
    expect(groupUses(USES).size).toBe(2);
  });

  it('excludes the canonical stylesheet', () => {
    const keys = [...groupUses(USES).keys()];
    expect(keys.some((key) => key.startsWith(CANONICAL_STYLESHEET))).toBe(
      false,
    );
  });

  it('returns an empty map when there are no bespoke uses', () => {
    expect(groupUses([USES[3]]).size).toBe(0);
  });
});

describe('nearestCanonical', () => {
  const canonical = {
    icon: { background: 'none', border: 'none', padding: '0' },
    row: { display: 'flex', width: '100%' },
  };

  it('returns the variant with the highest overlap', () => {
    const match = nearestCanonical(
      { background: 'none', border: 'none', padding: '0' },
      canonical,
    );
    expect(match).toEqual({ name: 'icon', score: 1 });
  });

  it('scores a partial match below 1', () => {
    const match = nearestCanonical({ display: 'flex' }, canonical);
    expect(match.name).toBe('row');
    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBeLessThan(1);
  });

  it('returns no match for declarations that share nothing', () => {
    expect(nearestCanonical({ color: 'red' }, canonical)).toEqual({
      name: null,
      score: 0,
    });
  });

  it('returns no match when there are no canonical variants', () => {
    expect(nearestCanonical({ color: 'red' }, {})).toEqual({
      name: null,
      score: 0,
    });
  });
});
