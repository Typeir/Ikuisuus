/**
 * @fileoverview MatchSnippet Atom Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/MatchSnippet.test
 */

import { MatchSnippet } from '@/modules/search/presentation/atoms/MatchSnippet';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
