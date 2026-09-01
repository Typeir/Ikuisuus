/**
 * @fileoverview Unit tests for search domain types.
 * @description Asserts search domain types are JSON-serializable and
 * `SearchQuery.locale` is required.
 *
 * @module tests/unit/src/modules/search/domain/types.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/modules/search/domain/types Module under test
 */

import type {
    SearchQuery,
    SearchRecord,
    SearchResponse,
    SearchResult,
} from '@/modules/search/domain/types';
import { describe, expect, it } from 'vitest';

describe('search domain types', () => {
  it('constructs a JSON-safe SearchRecord', () => {
    const record: SearchRecord = {
      id: 'monsters:en:aboleth',
      type: 'monsters',
      locale: 'en',
      slug: 'aboleth',
      title: 'Aboleth',
      link: '/en/library/monsters/aboleth',
      description: 'An ancient aberration.',
      snippet: 'An ancient <mark>aberration</mark>.',
      tags: ['aberration'],
      image: '/library/images/aboleth.webp',
      meta: { cr: '10', size: 'large' },
    };

    const roundTripped = JSON.parse(JSON.stringify(record)) as SearchRecord;
    expect(roundTripped).toEqual(record);
  });

  it('requires locale on a SearchQuery', () => {
    const query: SearchQuery = { term: 'aboleth', locale: 'en' };
    expect(query.locale).toBe('en');
  });

  it('models a scored SearchResult with match provenance', () => {
    const result: SearchResult = {
      record: {
        id: 'spells:en:fireball',
        type: 'spells',
        locale: 'en',
        slug: 'fireball',
        title: 'Fireball',
        link: '/en/library/spells/fireball',
      },
      score: 0.87,
      snippet: 'A bright streak…',
      matchedFields: ['title', 'content'],
    };

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedFields).toContain('title');
  });

  it('models a paginated SearchResponse with facets', () => {
    const response: SearchResponse = {
      results: [],
      total: 0,
      facets: [
        {
          field: 'type',
          label: 'Type',
          values: [{ value: 'spells', count: 3 }],
        },
      ],
      page: 1,
    };

    expect(response.facets[0].values[0].count).toBe(3);
    expect(response.page).toBe(1);
  });
});
