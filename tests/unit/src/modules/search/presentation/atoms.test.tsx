/**
 * @fileoverview Search Result Atoms Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/atoms
 */

import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import { SEARCH_CONTENT_TYPES } from '@/modules/search/domain';
import { MatchSnippet } from '@/modules/search/presentation/atoms/MatchSnippet';
import { MetaTrail } from '@/modules/search/presentation/atoms/MetaTrail';
import { ResultThumb } from '@/modules/search/presentation/atoms/ResultThumb';
import { ResultTitle } from '@/modules/search/presentation/atoms/ResultTitle';
import { TypeSigil } from '@/modules/search/presentation/atoms/TypeSigil';
import { SearchResultRow } from '@/modules/search/presentation/SearchResultRow/SearchResultRow';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TypeSigil', () => {
  for (const type of SEARCH_CONTENT_TYPES) {
    it(`should render for type: ${type}`, () => {
      render(<TypeSigil type={type} />);
      const sigil = document.querySelector('[aria-hidden="true"]');
      expect(sigil).toBeTruthy();
    });
  }
});

describe('ResultTitle', () => {
  it('should render the title text', () => {
    render(<ResultTitle title='Ancient Dragon' />);
    expect(screen.getByText('Ancient Dragon')).toBeTruthy();
  });
});

describe('MatchSnippet', () => {
  it('should render snippet with mark highlights', () => {
    render(<MatchSnippet snippet='The <mark>ancient</mark> dragon' />);
    const el = screen.getByTestId('search-snippet');
    expect(el.innerHTML).toContain('<mark>ancient</mark>');
  });

  it('should return null when snippet is undefined', () => {
    const { container } = render(<MatchSnippet />);
    expect(container.innerHTML).toBe('');
  });
});

describe('MetaTrail', () => {
  it('should render chips from meta fields', () => {
    render(
      <MetaTrail
        meta={{ cr: '10', school: 'Evocation', tags: 'fire, dragon' }}
      />,
    );
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('EVOCATION')).toBeTruthy();
    expect(screen.getByText('FIRE')).toBeTruthy();
    expect(screen.getByText('DRAGON')).toBeTruthy();
  });

  it('should return null when meta is empty', () => {
    const { container } = render(<MetaTrail meta={{}} />);
    expect(
      container.querySelector('[aria-label="Matched metadata"]'),
    ).toBeNull();
  });
});

describe('ResultThumb', () => {
  it('should render image when provided', () => {
    render(
      <ResultThumb
        image='/library/images/test.webp'
        type='monsters'
        alt='Test monster'
      />,
    );
    const img = screen.getByAltText('Test monster');
    expect(img).toBeTruthy();
    /* next/image rewrites src through the optimizer; the original path
       survives URL-encoded in the `url` query param. */
    expect(img.getAttribute('src')).toContain(
      encodeURIComponent('/library/images/test.webp'),
    );
  });

  it('should fall back to TypeSigil when image is missing', () => {
    const { container } = render(<ResultThumb type='spells' />);
    const sigil = container.querySelector('[aria-hidden="true"]');
    expect(sigil).toBeTruthy();
  });
});

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
});
