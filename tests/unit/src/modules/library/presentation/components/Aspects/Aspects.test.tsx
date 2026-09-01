/**
 * @fileoverview Aspects Component Tests
 * @description Covers rendering, density threshold carousel compression, and accessibility.
 *
 * @module tests/unit/src/modules/library/presentation/components/Aspects/Aspects.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { ArticleMetadataProvider } from '@/modules/library/application/context/ArticleMetadataContext';
import { Aspects } from '@/modules/library/presentation/components/Aspects';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

beforeAll(() => {
  class MockObserver {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(): void {
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    disconnect(): void {}
    unobserve(): void {}
  }

  vi.stubGlobal('IntersectionObserver', MockObserver);
});

describe('Aspects', () => {
  it('should render nothing when there is nothing to draw', () => {
    const { container } = render(<Aspects aspects={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render nothing when every aspect is internal', () => {
    const { container } = render(
      <Aspects aspects={['meta:locale:en', 'meta:source:ikuisuus']} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should accept a space-separated list for MDX authoring', () => {
    render(<Aspects list='damage:fire condition:prone' />);

    expect(screen.getByLabelText('damage: fire')).toBeInTheDocument();
    expect(screen.getByLabelText('condition: prone')).toBeInTheDocument();
  });

  /**
   * Each pill's accessible name is its full aspect.
   */
  it('should name every pill with its full aspect', () => {
    render(<Aspects aspects={['save:dex']} />);

    expect(screen.getByLabelText('save: dex')).toBeInTheDocument();
  });

  it('should link each pill to its pre-filtered search', () => {
    render(<Aspects aspects={['damage:fire']} />);

    expect(screen.getByLabelText('damage: fire')).toHaveAttribute(
      'href',
      '/en/search?aspect=damage%3Afire',
    );
  });

  it('should render a flat row at or below the density threshold', () => {
    const aspects = Array.from({ length: 14 }, (_, i) => `save:s${i}`);
    render(<Aspects aspects={aspects} />);

    expect(screen.getAllByRole('link')).toHaveLength(14);
    expect(screen.queryByText('14')).not.toBeInTheDocument();
  });

  /** Past the density threshold the row compresses and shows a count. */
  it('should compress into a carousel past the density threshold', () => {
    const aspects = Array.from({ length: 15 }, (_, i) => `save:s${i}`);
    render(<Aspects aspects={aspects} />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(15);
  });

  /**
   * The expand toggle is absent when there is no provider to write to.
   */
  it('should omit the expand toggle when there is no provider to write to', () => {
    const aspects = Array.from({ length: 15 }, (_, i) => `save:s${i}`);
    render(<Aspects aspects={aspects} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render the expand toggle inside a provider', () => {
    const aspects = Array.from({ length: 15 }, (_, i) => `save:s${i}`);
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Aspects aspects={aspects} />
      </PersistentUiProvider>,
    );

    const toggle = screen.getByRole('button', { name: 'Expand aspects' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  /** Writing the toggle sets data-aspect-expanded on the document root. */
  it('should stamp the document root and flip its label when pressed', async () => {
    const user = userEvent.setup({ delay: null });
    const aspects = Array.from({ length: 15 }, (_, i) => `save:s${i}`);
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Aspects aspects={aspects} />
      </PersistentUiProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Expand aspects' }));

    expect(document.documentElement.getAttribute('data-aspect-expanded')).toBe(
      'true',
    );
    const toggle = screen.getByRole('button', { name: 'Collapse aspects' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('should caption a conditional row with the level it is gained at', () => {
    render(<Aspects aspects={['condition:stunned']} from='7' />);

    expect(screen.getByText('from 7')).toBeInTheDocument();
  });

  /**
   * Resolves aspects from article metadata by section key.
   */
  it('should read its aspects from the article metadata by section', () => {
    render(
      <ArticleMetadataProvider
        metadata={{
          sections: [
            { name: 'Garbage Communion', tags: ['resource:temp-hp'] },
          ],
        }}
      >
        <Aspects section='Garbage Communion' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByLabelText('resource: temp-hp')).toBeInTheDocument();
  });

  it('should render nothing for a section the article does not have', () => {
    const { container } = render(
      <ArticleMetadataProvider metadata={{ sections: [] }}>
        <Aspects section='Nowhere' />
      </ArticleMetadataProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  /** An explicit list overrides the section lookup. */
  it('should prefer an explicit list over the section lookup', () => {
    render(
      <ArticleMetadataProvider
        metadata={{ sections: [{ name: 'S', tags: ['damage:fire'] }] }}
      >
        <Aspects section='S' list='damage:frost' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByLabelText('damage: frost')).toBeInTheDocument();
    expect(screen.queryByLabelText('damage: fire')).not.toBeInTheDocument();
  });
});
