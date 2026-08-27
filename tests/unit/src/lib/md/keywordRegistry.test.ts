/**
 * @fileoverview keywordRegistry Unit Tests
 * @description Tests for the keyword registry entries and its normalizing
 * lookup semantics.
 *
 * @module tests/unit/lib/md/keywordRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordRegistry Registry under test
 */

import { normalizeKeyword } from '@/lib/md/keywordExpressionParser';
import { KEYWORD_REGISTRY, lookupKeyword } from '@/lib/md/keywordRegistry';
import { describe, expect, it } from 'vitest';

describe('keywordRegistry', () => {
  describe('entries', () => {
    it('should register the launch keywords', () => {
      expect(Object.keys(KEYWORD_REGISTRY)).toEqual(
        expect.arrayContaining(['accuracy', 'damage bonus', 'briefly']),
      );
    });

    it('should carry an href and blurb on every entry', () => {
      for (const entry of Object.values(KEYWORD_REGISTRY)) {
        expect(entry.href.length).toBeGreaterThan(0);
        expect(entry.blurb.length).toBeGreaterThan(0);
      }
    });

    it('should key every entry by its own canonical term', () => {
      for (const [key, entry] of Object.entries(KEYWORD_REGISTRY)) {
        expect(entry.term).toBe(key);
        expect(normalizeKeyword(key)).toBe(key);
      }
    });
  });

  describe('lookupKeyword', () => {
    it('should resolve case-insensitively', () => {
      expect(lookupKeyword('Accuracy')?.term).toBe('accuracy');
      expect(lookupKeyword('BRIEFLY')?.term).toBe('briefly');
    });

    it('should collapse inner whitespace', () => {
      expect(lookupKeyword('damage   bonus')?.term).toBe('damage bonus');
    });

    it('should return null for unregistered terms', () => {
      expect(lookupKeyword('swiftness')).toBeNull();
    });
  });
});
