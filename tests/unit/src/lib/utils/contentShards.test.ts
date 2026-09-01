/**
 * @fileoverview Content Shard Selector Unit Tests
 * @description Tests shard lookup by addressing key and the main selector.
 *
 * @module tests/unit/src/lib/utils/contentShards.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { mainShard, shardFor } from '@/lib/utils/contentShards';
import type { ResolvedShard } from '@/lib/types/api';
import { describe, expect, it } from 'vitest';

const SHARDS: ResolvedShard[] = [
  { id: 'main', key: 'main', heading: 'main', source: 'Body.', href: 'library/x' },
  { id: 'rage', key: 'Rage', heading: 'Rage', source: 'Rage prose.', href: 'library/x#rage' },
];

describe('shardFor', () => {
  it('finds a shard by its addressing key', () => {
    expect(shardFor(SHARDS, 'Rage')?.source).toBe('Rage prose.');
  });

  it('returns undefined for an absent key or shards', () => {
    expect(shardFor(SHARDS, 'Frenzy')).toBeUndefined();
    expect(shardFor(undefined, 'Rage')).toBeUndefined();
  });
});

describe('mainShard', () => {
  it('returns the main shard', () => {
    expect(mainShard(SHARDS)?.source).toBe('Body.');
  });

  it('returns undefined when no main shard exists', () => {
    expect(mainShard(SHARDS.slice(1))).toBeUndefined();
  });
});
