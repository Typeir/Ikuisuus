/**
 * @fileoverview What a sheet does again when it renders again.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetRendering.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 *
 * @description Reading a sheet's pages means walking every node it was given,
 * and building them means an element tree per page. A sheet renders again
 * whenever a page is turned or a header takes its ground, and neither of those
 * changes what it was given. These hold that work to once.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* `readDivisions` walks into what it finds, so counting it counts the
   shape of the tree. `labelsOf` runs once for each time the walk is set
   off, which is the number these are about. */
const { readDivisions, labelsOf } = vi.hoisted(() => ({
  readDivisions: vi.fn(),
  labelsOf: vi.fn(),
}));

vi.mock(
  '@/modules/library/presentation/components/slots/divisions',
  async (real) => {
    const actual =
      await real<
        typeof import('@/modules/library/presentation/components/slots/divisions')
      >();
    readDivisions.mockImplementation(actual.readDivisions);
    labelsOf.mockImplementation(actual.labelsOf);
    return { ...actual, readDivisions, labelsOf };
  },
);

const { default: Sheet } = await import(
  '@/modules/library/presentation/components/slots/Sheet'
);

beforeEach(() => {
  readDivisions.mockClear();
  labelsOf.mockClear();

  const idle = class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
  };
  vi.stubGlobal('IntersectionObserver', idle);
  vi.stubGlobal('ResizeObserver', idle);
  /* Tabs rather than scrolling, so a turn is a render rather than a scroll. */
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

/**
 * A sheet of three pages, the way the compiler hands one over.
 *
 * @returns {React.JSX.Element} The sheet.
 */
const sheet = (): React.JSX.Element => (
  <Sheet>
    <h2 data-anchor='traits' data-title='Traits'>
      Traits
    </h2>
    <p>A passive thing.</p>
    <section data-anchor='features' data-heading-level={2}>
      <h2 data-anchor='features' data-title='Features'>
        Features
      </h2>
      <p>A distinctive smell.</p>
    </section>
    <section data-anchor='deeds' data-heading-level={2}>
      <h2 data-anchor='deeds' data-title='Deeds'>
        Deeds
      </h2>
      <p>A terrible act.</p>
    </section>
  </Sheet>
);

describe('a sheet renders its pages once', () => {
  it('should set the walk off once, however often it settles on mount', () => {
    render(sheet());
    expect(labelsOf).toHaveBeenCalledTimes(1);
  });

  it('should not walk again for anything that is not the children', () => {
    render(sheet());
    labelsOf.mockClear();
    readDivisions.mockClear();

    fireEvent(window, new Event('resize'));
    fireEvent.click(screen.getByRole('button', { name: 'Features' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deeds' }));

    expect(labelsOf).not.toHaveBeenCalled();
    expect(readDivisions).not.toHaveBeenCalled();
  });

  it('should not read them again when a page is turned', () => {
    render(sheet());
    readDivisions.mockClear();
    labelsOf.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Deeds' }));

    expect(readDivisions).not.toHaveBeenCalled();
  });

  it('should not read them again when a page is revealed', () => {
    const { container } = render(sheet());
    readDivisions.mockClear();

    fireEvent(
      container.querySelectorAll('[data-sheet-page]')[2],
      new Event('beforematch', { bubbles: true }),
    );

    expect(readDivisions).not.toHaveBeenCalled();
  });

  it('should keep the page bodies it already built', () => {
    const { container } = render(sheet());
    const pages = container.querySelectorAll('[data-sheet-page]');
    const before = [...pages].map((page) => page.firstElementChild);

    fireEvent.click(screen.getByRole('button', { name: 'Deeds' }));

    /* The same nodes, not replacements: React reconciles nothing inside a
       page whose element it was handed back unchanged. */
    const after = [...container.querySelectorAll('[data-sheet-page]')].map(
      (page) => page.firstElementChild,
    );
    expect(after).toEqual(before);
  });
});
