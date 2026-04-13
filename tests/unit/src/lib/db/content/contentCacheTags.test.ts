/**
 * @fileoverview Unit Tests — contentCacheTags
 * @description Validates the cache tag builder used by content source adapters
 * and the revalidation API.
 *
 * @module tests/unit/lib/db/content/contentCacheTags
 */

import { contentCacheTag } from '@/lib/db/content/contentCacheTags';
import { describe, expect, it } from 'vitest';

describe('contentCacheTag', () => {
  it('builds a tag from locale and slug path', () => {
    expect(contentCacheTag('en', 'monsters/albedo')).toBe(
      'content-en-monsters/albedo',
    );
  });

  it('handles a Spanish locale', () => {
    expect(contentCacheTag('es', 'spells/fireball')).toBe(
      'content-es-spells/fireball',
    );
  });

  it('handles Finnish locale', () => {
    expect(contentCacheTag('fi', 'items/heirlooms/sword')).toBe(
      'content-fi-items/heirlooms/sword',
    );
  });

  it('handles empty slug path', () => {
    expect(contentCacheTag('en', '')).toBe('content-en-');
  });

  it('preserves nested slug separators', () => {
    expect(contentCacheTag('en', 'items/heirlooms/blackbone-crusher')).toBe(
      'content-en-items/heirlooms/blackbone-crusher',
    );
  });

  it('prefixes with content-', () => {
    const tag = contentCacheTag('en', 'test-slug');
    expect(tag.startsWith('content-')).toBe(true);
  });

  it('includes the locale between content- prefix and slug', () => {
    const tag = contentCacheTag('en', 'slug/path');
    const parts = tag.split('-');
    expect(parts[1]).toBe('en');
  });
});
