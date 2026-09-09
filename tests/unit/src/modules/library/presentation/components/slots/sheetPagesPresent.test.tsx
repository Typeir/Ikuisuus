/**
 * @fileoverview Every page of a sheet stays in the document.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetPagesPresent.test
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 *
 * @description A page nobody is reading is hidden, never absent, so
 * find-in-page can reach it and an anchor has something to point at.
 */

import { REVEAL_EVENT } from '@/lib/constants/domEvents';
import Sheet from '@/modules/library/presentation/components/slots/Sheet';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  const idle = class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
  };
  vi.stubGlobal('IntersectionObserver', idle);
  vi.stubGlobal('ResizeObserver', idle);
});

/**
 * A sheet of the shape the compiler hands one over.
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

/**
 * The sheet's pages, in order.
 *
 * @param {HTMLElement} container - What was rendered.
 * @returns {HTMLElement[]} The pages.
 */
const pagesOf = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-sheet-page]'));

describe('a sheet keeps every page in the document', () => {
  it('should render all of them, not only the one being read', () => {
    const { container } = render(sheet());
    expect(pagesOf(container)).toHaveLength(3);
  });

  it('should leave the words of an unread page findable', () => {
    render(sheet());
    expect(screen.getByText('A terrible act.')).toBeInTheDocument();
  });

  it('should show exactly one page', () => {
    const { container } = render(sheet());
    const shown = pagesOf(container).filter(
      (page) => page.dataset.shown === 'true',
    );
    expect(shown).toHaveLength(1);
  });

  it('should hide the rest in the way that keeps them findable', () => {
    const { container } = render(sheet());
    const [, second, third] = pagesOf(container);

    expect(second.getAttribute('hidden')).toBe('until-found');
    expect(third.getAttribute('hidden')).toBe('until-found');
  });

  it('should not hide the page being read', () => {
    const { container } = render(sheet());
    expect(pagesOf(container)[0].hasAttribute('hidden')).toBe(false);
  });

  it('should carry its anchor, so what reveals it knows which it is', () => {
    const { container } = render(sheet());
    expect(pagesOf(container).map((page) => page.dataset.anchor)).toEqual([
      'traits',
      'features',
      'deeds',
    ]);
  });
});

describe('a sheet turns to a page it is asked for', () => {
  it('should turn when find-in-page reaches into a hidden one', () => {
    const { container } = render(sheet());
    const third = pagesOf(container)[2];

    fireEvent(third, new Event('beforematch', { bubbles: true }));

    expect(third.dataset.shown).toBe('true');
    expect(third.hasAttribute('hidden')).toBe(false);
  });

  it('should turn when something inside a hidden page asks to be revealed', () => {
    const { container } = render(sheet());
    const buried = screen.getByText('A distinctive smell.');

    fireEvent(buried, new CustomEvent(REVEAL_EVENT, { bubbles: true }));

    expect(pagesOf(container)[1].dataset.shown).toBe('true');
  });

  it('should hide the page it turned away from once the turn has settled', () => {
    const { container } = render(sheet());
    fireEvent(pagesOf(container)[2], new Event('beforematch', { bubbles: true }));

    /* The page turning away is held while it fades, so it is neither shown
       nor hidden yet. */
    expect(pagesOf(container)[0].dataset.leaving).toBe('true');
  });

  it('should stay put when asked for the page already being read', () => {
    const { container } = render(sheet());
    fireEvent(pagesOf(container)[0], new Event('beforematch', { bubbles: true }));

    expect(pagesOf(container)[0].dataset.shown).toBe('true');
    expect(pagesOf(container)[0].dataset.leaving).toBeUndefined();
  });
});
