/**
 * @fileoverview Unit tests for buildShardsFromSource.
 * @module tests/unit/src/modules/library/infrastructure/content/buildShardsFromSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { FeatureEntry } from '@/lib/types/vocations';
import { buildShardsFromSource } from '@/modules/library/infrastructure/content/buildShardsFromSource';
import { describe, expect, it } from 'vitest';

describe('buildShardsFromSource', () => {
  it('builds shard ids and cached text', () => {
    const source = [
      '## Feature One',
      'First paragraph.',
      '',
      '## Feature Two',
      'Second paragraph.',
    ].join('\n');
    const features: FeatureEntry[] = [
      { level: 1, name: 'Feature One' },
      { level: 2, name: 'Feature Two' },
    ];

    const shards = buildShardsFromSource(
      'vocation-x',
      'character-creation/vocations/vocation-x/main.mdx',
      source,
      features,
      'vocation-feature',
    );

    expect(shards).toHaveLength(2);
    expect(shards[0].id).toBe('vocation-x::1::Feature One');
    expect(shards[0].cachedText).toBe('First paragraph.');
  });
});
