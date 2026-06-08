/**
 * @fileoverview Unit tests for the LibraryArticle presentation wrapper.
 * @module tests/unit/src/modules/library/presentation/LibraryArticle/LibraryArticle
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { LibraryArticle } from '@/modules/library/presentation/LibraryArticle/LibraryArticle';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('LibraryArticle', () => {
  it('renders children inside the standard article frame', () => {
    const { container } = render(
      <LibraryArticle>
        <p>Article body</p>
      </LibraryArticle>,
    );

    expect(screen.getByText('Article body')).toBeInTheDocument();

    const wrapper = container.firstElementChild as HTMLElement | null;
    const article = container.querySelector('article');

    expect(wrapper?.className).toContain('prose');
    expect(wrapper?.className).toContain('prose-invert');
    expect(wrapper?.className).toContain('mx-auto');
    expect(article?.className).toContain('markdown');
  });

  it('uses containerClassName when provided', () => {
    const { container } = render(
      <LibraryArticle containerClassName='custom-wrapper'>
        <p>Custom class</p>
      </LibraryArticle>,
    );

    const wrapper = container.firstElementChild as HTMLElement | null;

    expect(wrapper?.className).toBe('custom-wrapper');
  });

  it('injects streamText as CSS custom property when provided', () => {
    const { container } = render(
      <LibraryArticle streamText='Whispers'>
        <p>With stream text</p>
      </LibraryArticle>,
    );

    const wrapper = container.firstElementChild as HTMLElement | null;

    expect(wrapper?.getAttribute('style')).toContain('--stream-text');
    expect(wrapper?.style.getPropertyValue('--stream-text')).toContain(
      'Whispers',
    );
  });
});
