/**
 * @fileoverview SearchResultRow Unit Tests
 * @module tests/unit/src/modules/search/presentation/SearchResultRow/SearchResultRow.test
 */

import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import { SearchResultRow } from '@/modules/search/presentation/SearchResultRow/SearchResultRow';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SearchResultRow', () => {
  const mockResult: SearchResult = {
    record: {
      id: 'monsters:en:test',
      type: 'monsters' as SearchContentType,
      locale: 'en',
      slug: 'test',
      title: 'Test Monster',
      link: '/en/library/monsters/test',
      description: 'A test creature.',
      tags: ['aberration'],
      meta: { cr: '5', size: 'Large' },
    },
    score: 10,
    snippet: 'A <mark>test</mark> monster lurks...',
    matchedFields: ['type'],
  };

  it('should render sigil, title, snippet, meta, and thumb', () => {
    render(<SearchResultRow result={mockResult} />);
    expect(screen.getByText('Test Monster')).toBeTruthy();
    expect(screen.getByTestId('search-snippet')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('LARGE')).toBeTruthy();
  });

  it('should link to the record link', () => {
    render(<SearchResultRow result={mockResult} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/en/library/monsters/test');
  });

  it('should render card variant with description', () => {
    render(<SearchResultRow result={mockResult} variant='card' />);
    expect(screen.getByText('Test Monster')).toBeTruthy();
    expect(screen.getByText('A test creature.')).toBeTruthy();
  });
});
