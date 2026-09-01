/**
 * @fileoverview Search content-type taxonomy unit tests
 * @description Verifies the {@link CONTENT_TYPE_META} registry is exhaustive over
 * {@link SearchContentType} and that every entry is well-formed.
 *
 * @module tests/unit/src/modules/search/domain/contentTypes.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/modules/search/domain/contentTypes Module under test
 */

import {
    CONTENT_TYPE_META,
    SEARCH_CONTENT_TYPES,
    type SearchContentType,
} from '@/modules/search/domain/contentTypes';
import { describe, expect, it } from 'vitest';

/**
 * The full expected set of content types. Kept independent of the source so the
 * test fails loudly if a type is added or removed without intent.
 */
const EXPECTED_TYPES: SearchContentType[] = [
  'monsters',
  'heirlooms',
  'spells',
  'trinkets',
  'bloodlines',
  'vocations',
  'specializations',
  'feats',
  'world',
  'rules',
];

describe('CONTENT_TYPE_META', () => {
  it('has an entry for every expected content type', () => {
    for (const type of EXPECTED_TYPES) {
      expect(CONTENT_TYPE_META[type]).toBeDefined();
    }
  });

  it('has no extra entries beyond the expected content types', () => {
    expect(Object.keys(CONTENT_TYPE_META).sort()).toEqual(
      [...EXPECTED_TYPES].sort(),
    );
  });

  it('exposes SEARCH_CONTENT_TYPES matching the registry keys', () => {
    expect([...SEARCH_CONTENT_TYPES].sort()).toEqual(
      [...EXPECTED_TYPES].sort(),
    );
  });

  it('every entry has a non-empty label, icon, colorTokenKey, and urlSegment', () => {
    for (const type of SEARCH_CONTENT_TYPES) {
      const meta = CONTENT_TYPE_META[type];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.urlSegment.length).toBeGreaterThan(0);
      expect(meta.colorTokenKey).toMatch(/^--search-type-/);
    }
  });
});
