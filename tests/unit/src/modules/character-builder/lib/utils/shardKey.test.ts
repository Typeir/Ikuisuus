/**
 * @fileoverview shardKey Tests
 * @description Anchor-based shard identity and the read-time backfill for
 * shards saved without a key.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/shardKey.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  anchorOf,
  entryKey,
  shardIs,
  shardKey,
} from '@/modules/character-builder/lib/utils/shardKey';
import { describe, expect, it } from 'vitest';

describe('shardKey', () => {
  it('should slug headings the way the sectionizer does, measures included', () => {
    expect(anchorOf('Aura of Stillness ([= 12 stride;ADJ =] radius)')).toBe(
      'aura-of-stillness-12-stride-radius',
    );
  });

  it('should prefer a stamped anchor and fall back to the heading or name', () => {
    expect(entryKey({ name: 'Mind', anchor: 'mind' })).toBe('mind');
    expect(entryKey({ name: 'Spellcasting', heading: '1st Level – Spellcasting' })).toBe(
      '1st-level-spellcasting',
    );
    expect(entryKey({ name: 'Urban Explorer' })).toBe('urban-explorer');
  });

  it('should derive the key of an older shard from its heading', () => {
    expect(shardKey({ heading: 'Urban Explorer' })).toBe('urban-explorer');
    expect(shardKey({ heading: 'Old text', key: 'urban-explorer' })).toBe('urban-explorer');
  });

  it('should match a shard to its entry across a heading restyle', () => {
    const shard = { heading: 'Urban explorer', key: 'urban-explorer' };
    expect(shardIs(shard, { name: 'Urban Explorer', anchor: 'urban-explorer' })).toBe(true);
    expect(shardIs({ heading: 'Urban   Explorer' }, { name: 'Urban Explorer' })).toBe(true);
    expect(shardIs(shard, { name: 'Tradesmith', anchor: 'tradesmith' })).toBe(false);
  });
});
