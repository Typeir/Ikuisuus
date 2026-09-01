/**
 * @fileoverview Tests for Shard to Preview Utilities
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/shardToPreview.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { shardToPreview } from '@/modules/character-builder/lib/utils/shardToPreview';
import { describe, expect, it } from 'vitest';

describe('shardToPreview', () => {
  describe('Bloodline Pattern', () => {
    it('extracts bloodline slug from standard pattern', () => {
      const result = shardToPreview(
        'character-creation/bloodlines/empyrean.bloodline.mdx',
      );
      expect(result).toEqual({ kind: 'bloodlines', slug: 'empyrean' });
    });

    it('handles bloodlines with hyphens in slug', () => {
      const result = shardToPreview(
        'character-creation/bloodlines/the-ancient-ones.bloodline.mdx',
      );
      expect(result).toEqual({ kind: 'bloodlines', slug: 'the-ancient-ones' });
    });
  });

  describe('Vocation Pattern', () => {
    it('extracts vocation slug from directory pattern', () => {
      const result = shardToPreview(
        'character-creation/vocations/wizard/main.mdx',
      );
      expect(result).toEqual({ kind: 'vocations', slug: 'wizard' });
    });

    it('handles vocations with hyphens in slug', () => {
      const result = shardToPreview(
        'character-creation/vocations/battle-mage/main.mdx',
      );
      expect(result).toEqual({ kind: 'vocations', slug: 'battle-mage' });
    });
  });

  describe('Specialization Pattern', () => {
    it('extracts specialization slug from directory pattern', () => {
      const result = shardToPreview(
        'character-creation/specializations/evocation/main.mdx',
      );
      expect(result).toEqual({ kind: 'specializations', slug: 'evocation' });
    });

    it('handles specializations with hyphens in slug', () => {
      const result = shardToPreview(
        'character-creation/specializations/fire-and-ice/main.mdx',
      );
      expect(result).toEqual({ kind: 'specializations', slug: 'fire-and-ice' });
    });
  });

  describe('Feat Pattern', () => {
    it('extracts feat slug from standard pattern', () => {
      const result = shardToPreview('character-creation/feats/fireball.mdx');
      expect(result).toEqual({ kind: 'feats', slug: 'fireball' });
    });

    it('handles feats with hyphens in slug', () => {
      const result = shardToPreview(
        'character-creation/feats/extra-attack.mdx',
      );
      expect(result).toEqual({ kind: 'feats', slug: 'extra-attack' });
    });
  });

  describe('Invalid Patterns', () => {
    it('returns null for empty string', () => {
      const result = shardToPreview('');
      expect(result).toBeNull();
    });

    it('returns null for single path segment', () => {
      const result = shardToPreview('file.mdx');
      expect(result).toBeNull();
    });

    it('returns null for unrecognized directory structure', () => {
      const result = shardToPreview('unknown/path/file.mdx');
      expect(result).toBeNull();
    });

    it('returns null for vocation pattern with wrong filename', () => {
      const result = shardToPreview(
        'character-creation/vocations/wizard/vocation.mdx',
      );
      expect(result).toBeNull();
    });

    it('returns null for bloodline pattern with wrong extension', () => {
      const result = shardToPreview(
        'character-creation/bloodlines/empyrean.mdx',
      );
      expect(result).toBeNull();
    });

    it('returns null for feat pattern with wrong extension', () => {
      const result = shardToPreview('feats/fireball.mdx');
      expect(result).toBeNull();
    });

    it('returns null for malformed feat path', () => {
      const result = shardToPreview('feats/subdir/fireball.feat.mdx');
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple dots in slug', () => {
      const result = shardToPreview(
        'character-creation/bloodlines/dr.strange.bloodline.mdx',
      );
      expect(result).toEqual({ kind: 'bloodlines', slug: 'dr.strange' });
    });

    it('returns null for vocation with extra path segments', () => {
      const result = shardToPreview(
        'character-creation/vocations/wizard/subdir/main.mdx',
      );
      expect(result).toBeNull();
    });

    it('returns null for specialization with extra path segments', () => {
      const result = shardToPreview(
        'character-creation/specializations/evocation/subdir/main.mdx',
      );
      expect(result).toBeNull();
    });
  });
});
