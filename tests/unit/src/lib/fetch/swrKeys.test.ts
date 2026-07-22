/**
 * @fileoverview Unit tests for SWR key builders
 * @description Verifies that key builder functions return the correct tuple
 * structures and that `enabled=false` / null inputs produce `null` keys.
 *
 * @module tests/unit/lib/fetch/swrKeys
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    affixesIndexKey,
    bloodlinesKey,
    contentShardKey,
    correctionsTreeKey,
    draftKey,
    featsKey,
    heirloomsKey,
    monstersIndexKey,
    monstersKey,
    nearestRouteKey,
    shardKey,
    specializationsKey,
    spellKey,
    spellSourcesKey,
    spellsIndexKey,
    trinketsKey,
    urlForBloodlines,
    urlForContentShard,
    urlForFeats,
    urlForShard,
    urlForSpecializations,
    urlForVocations,
    vocationsKey,
} from '@/lib/fetch/swrKeys';
import { describe, expect, it } from 'vitest';

describe('swrKeys', () => {
  describe('bloodlinesKey', () => {
    it('returns tuple when enabled', () => {
      expect(bloodlinesKey('en', true)).toEqual(['bloodlines', 'en']);
    });
    it('returns null when disabled', () => {
      expect(bloodlinesKey('en', false)).toBeNull();
    });
    it('returns null when enabled is undefined', () => {
      expect(bloodlinesKey('en')).toBeNull();
    });
  });

  describe('vocationsKey', () => {
    it('returns tuple when enabled', () => {
      expect(vocationsKey('es', true)).toEqual(['vocations', 'es']);
    });
    it('returns null when disabled', () => {
      expect(vocationsKey('es', false)).toBeNull();
    });
  });

  describe('specializationsKey', () => {
    it('returns tuple when enabled', () => {
      expect(specializationsKey('fi', true)).toEqual(['specializations', 'fi']);
    });
  });

  describe('featsKey', () => {
    it('returns tuple when enabled', () => {
      expect(featsKey('en', true)).toEqual(['feats', 'en']);
    });
    it('returns null when disabled', () => {
      expect(featsKey('en', false)).toBeNull();
    });
  });

  describe('monstersKey', () => {
    it('always returns a tuple', () => {
      expect(monstersKey('en')).toEqual(['monsters', 'en']);
    });
  });

  describe('heirloomsKey', () => {
    it('always returns a tuple', () => {
      expect(heirloomsKey('fi')).toEqual(['heirlooms', 'fi']);
    });
  });

  describe('trinketsKey', () => {
    it('always returns a tuple', () => {
      expect(trinketsKey('es')).toEqual(['trinkets', 'es']);
    });
  });

  describe('monstersIndexKey', () => {
    it('always returns a tuple', () => {
      expect(monstersIndexKey('en')).toEqual(['monsters-index', 'en']);
    });
  });

  describe('spellsIndexKey', () => {
    it('always returns a tuple', () => {
      expect(spellsIndexKey('en')).toEqual(['spells-index', 'en']);
    });
  });

  describe('affixesIndexKey', () => {
    it('always returns a tuple', () => {
      expect(affixesIndexKey('en')).toEqual(['affixes-index', 'en']);
    });
  });

  describe('spellKey', () => {
    it('returns tuple with slug and locale', () => {
      expect(spellKey('fireball', 'en')).toEqual(['spell', 'fireball', 'en']);
    });
  });

  describe('draftKey', () => {
    it('includes locale and slug', () => {
      expect(draftKey('en', 'monsters/goblin')).toEqual([
        'draft',
        'en',
        'monsters/goblin',
      ]);
    });
  });

  describe('correctionsTreeKey', () => {
    it('returns tuple with locale', () => {
      expect(correctionsTreeKey('en')).toEqual(['corrections-tree', 'en']);
    });
  });

  describe('nearestRouteKey', () => {
    it('returns tuple for valid pathname', () => {
      expect(nearestRouteKey('/en/monsters')).toEqual([
        'nearest-route',
        '/en/monsters',
      ]);
    });
    it('returns null for null pathname', () => {
      expect(nearestRouteKey(null)).toBeNull();
    });
  });

  describe('shardKey', () => {
    it('returns tuple when enabled', () => {
      expect(shardKey('goblin', 'Goblin Attack', true)).toEqual([
        'shard',
        'goblin',
        'Goblin Attack',
      ]);
    });
    it('returns null when disabled', () => {
      expect(shardKey('goblin', 'Goblin Attack', false)).toBeNull();
    });
  });

  describe('contentShardKey', () => {
    it('returns tuple when enabled', () => {
      expect(contentShardKey('feats', 'tough', 'en', true)).toEqual([
        'content-shard',
        'feats',
        'tough',
        'en',
      ]);
    });
    it('returns null when disabled', () => {
      expect(contentShardKey('feats', 'tough', 'en', false)).toBeNull();
    });
  });

  describe('spellSourcesKey', () => {
    it('returns tuple with hash and locale', () => {
      expect(spellSourcesKey('abc123', 'en')).toEqual([
        'spell-sources',
        'abc123',
        'en',
      ]);
    });
  });

  describe('URL builders', () => {
    it('urlForBloodlines builds correct URL', () => {
      expect(urlForBloodlines('en')).toBe('/api/bloodlines?locale=en');
    });
    it('urlForVocations builds correct URL', () => {
      expect(urlForVocations('fi')).toBe('/api/vocations?locale=fi');
    });
    it('urlForSpecializations builds correct URL', () => {
      expect(urlForSpecializations('es')).toBe(
        '/api/specializations?locale=es',
      );
    });
    it('urlForFeats builds correct URL', () => {
      expect(urlForFeats('en')).toBe('/api/feats?locale=en');
    });
    it('urlForContentShard builds correct URL', () => {
      expect(urlForContentShard('feats', 'tough', 'en')).toBe(
        '/api/content-shards/feats/tough?locale=en',
      );
    });
    it('urlForShard builds correct URL with encoded params', () => {
      const url = urlForShard('goblin', 'Goblin Attack');
      expect(url).toContain('/api/shards?');
      expect(url).toContain('file=goblin');
      expect(url).toContain('heading=Goblin+Attack');
    });
  });
});
