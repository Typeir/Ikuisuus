/**
 * @fileoverview Boon Points Unit Tests
 * @description Tests for `computeBpSpent` from boonPoints.ts.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/boonPoints
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import { computeBpSpent } from '@/modules/character-builder/lib/utils/boonPoints';
import { describe, expect, it } from 'vitest';

describe('computeBpSpent', () => {
  it('sums bpCost for boon shards only', () => {
    const shards: CharacterShard[] = [
      {
        id: '1',
        sourceFile: 'f.mdx',
        heading: 'A',
        category: 'boon',
        bpCost: 3,
      },
      {
        id: '2',
        sourceFile: 'f.mdx',
        heading: 'B',
        category: 'boon',
        bpCost: 2,
      },
      {
        id: '3',
        sourceFile: 'f.mdx',
        heading: 'C',
        category: 'vocation-feature',
        level: 1,
      },
    ];
    expect(computeBpSpent(shards)).toBe(5);
  });

  it('returns 0 for empty array', () => {
    expect(computeBpSpent([])).toBe(0);
  });

  it('treats boon shards without bpCost as 0', () => {
    const shards: CharacterShard[] = [
      { id: '1', sourceFile: 'f.mdx', heading: 'A', category: 'boon' },
    ];
    expect(computeBpSpent(shards)).toBe(0);
  });
});
