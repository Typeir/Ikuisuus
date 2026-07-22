/**
 * @fileoverview MapRecord Unit Tests
 * @module tests/unit/src/modules/search/infrastructure/mapRecord
 */

import { mapPagefindResult } from '@/modules/search/infrastructure/mapRecord';
import { describe, expect, it } from 'vitest';

describe('mapPagefindResult', () => {
  const baseFragment = {
    url: '/en/library/monsters/aboleth',
    excerpt: 'The <mark>aboleth</mark> is an ancient creature...',
    meta: {
      title: 'Aboleth',
      slug: 'aboleth',
      type: 'monsters',
      image: '/library/images/aboleth.webp',
    },
    filters: {
      type: ['monsters'],
      cr: ['10'],
      tags: ['aberration'],
    },
  };

  it('should map a monster fragment to a SearchResult', () => {
    const result = mapPagefindResult(baseFragment, 'en');

    expect(result.record.id).toBe('monsters:en:aboleth');
    expect(result.record.type).toBe('monsters');
    expect(result.record.title).toBe('Aboleth');
    expect(result.record.link).toBe('/en/library/monsters/aboleth');
    expect(result.snippet).toContain('<mark>aboleth</mark>');
    expect(result.record.image).toBe('/library/images/aboleth.webp');
  });

  it('should default type to world when filters are missing', () => {
    const fragment = {
      ...baseFragment,
      filters: {} as Record<string, Record<string, string[]>>,
    };
    const result = mapPagefindResult(fragment, 'en');
    expect(result.record.type).toBe('world');
  });

  it('should handle a world lore record', () => {
    const fragment = {
      url: '/en/library/world/the-lands-of-damocles/thule',
      excerpt: 'The nation of <mark>Thule</mark>',
      meta: { title: 'Thule', slug: 'thule' },
      filters: {
        type: ['world'],
        category: ['nation'],
      },
    };
    const result = mapPagefindResult(fragment, 'en');

    expect(result.record.type).toBe('world');
    expect(result.record.slug).toBe('thule');
    expect(result.record.link).toBe(
      '/en/library/world/the-lands-of-damocles/thule',
    );
  });

  it('should preserve relative urls without leading slash', () => {
    const fragment = {
      ...baseFragment,
      url: 'library/monsters/aboleth',
    };
    const result = mapPagefindResult(fragment, 'en');
    expect(result.record.link).toBe('/en/library/monsters/aboleth');
  });
});
