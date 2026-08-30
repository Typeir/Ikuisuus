/**
 * @fileoverview ArticleTitleAction tests
 * @description Renders its child in the slot; without CSS anchors it writes
 * the h1 bottom edge into `--title-bottom` on the article.
 *
 * @module tests/unit/src/modules/library/presentation/LibraryArticle/ArticleTitleAction.test
 */

import { ArticleTitleAction } from '@/modules/library/presentation/LibraryArticle/ArticleTitleAction';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

describe('ArticleTitleAction', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the child inside the slot', () => {
    render(
      <article>
        <h1>Title</h1>
        <ArticleTitleAction>
          <a href='#edit'>Edit</a>
        </ArticleTitleAction>
      </article>,
    );
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
  });

  it('writes the title bottom edge when CSS anchors are unsupported', () => {
    const supports = vi.fn().mockReturnValue(false);
    vi.stubGlobal('CSS', { supports });
    const { container } = render(
      <article>
        <h1>Title</h1>
        <ArticleTitleAction>
          <a href='#edit'>Edit</a>
        </ArticleTitleAction>
      </article>,
    );
    const article = container.querySelector('article') as HTMLElement;
    expect(supports).toHaveBeenCalledWith('anchor-name: --a');
    expect(article.style.getPropertyValue('--title-bottom')).toMatch(/px$/);
  });

  it('leaves placement to CSS when anchors are supported', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const { container } = render(
      <article>
        <h1>Title</h1>
        <ArticleTitleAction>
          <a href='#edit'>Edit</a>
        </ArticleTitleAction>
      </article>,
    );
    const article = container.querySelector('article') as HTMLElement;
    expect(article.style.getPropertyValue('--title-bottom')).toBe('');
  });
});
