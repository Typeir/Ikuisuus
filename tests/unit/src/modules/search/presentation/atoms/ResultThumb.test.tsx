/**
 * @fileoverview ResultThumb Atom Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/ResultThumb
 */

import { ResultThumb } from '@/modules/search/presentation/atoms/ResultThumb';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
