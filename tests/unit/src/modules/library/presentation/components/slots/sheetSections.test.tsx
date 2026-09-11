/**
 * @fileoverview A sheet writes every section out and says which one you reached.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetSections.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 *
 * @description Nothing is hidden, turned, or held still. The sections sit
 * where they were written and the scroll is the reader's; the bar over them
 * names where they have got to and takes them anywhere else.
 */

import { READING_LINE } from '@/lib/constants/reading';
import Sheet from '@/modules/library/presentation/components/slots/sheet/Sheet';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** How tall the screen is taken to be. */
const SCREEN = 800;

/** Where down that screen a reader is taken to be reading. */
const LINE = SCREEN * READING_LINE;

beforeEach(() => {
  vi.stubGlobal('innerHeight', SCREEN);
  vi.stubGlobal('scrollY', 0);
  /* Run a booked frame at once, so a scroll is read within the act that
     raised it. */
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    fn(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 100000,
  });

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
 * A sheet of three sections, the way the compiler hands one over.
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
 * The sheet's sections, in order.
 *
 * @param {HTMLElement} container - What was rendered.
 * @returns {HTMLElement[]} The sections.
 */
const sectionsOf = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-sheet-page]'));

/**
 * Puts the sections down the page and lets the bar read them.
 *
 * @param {HTMLElement} container - What was rendered.
 * @param {number[]} tops - Where each section's top edge sits.
 * @returns {void} Nothing.
 */
const place = (container: HTMLElement, tops: number[]) => {
  sectionsOf(container).forEach((section, index) => {
    section.getBoundingClientRect = () =>
      ({ top: tops[index], height: 400, bottom: tops[index] + 400 }) as DOMRect;
  });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
};

describe('a sheet writes every section out', () => {
  it('should render all of them', () => {
    const { container } = render(sheet());
    expect(sectionsOf(container)).toHaveLength(3);
  });

  it('should leave every one of them readable', () => {
    render(sheet());

    expect(screen.getByText('A passive thing.')).toBeVisible();
    expect(screen.getByText('A distinctive smell.')).toBeVisible();
    expect(screen.getByText('A terrible act.')).toBeVisible();
  });

  it('should hide none of them', () => {
    const { container } = render(sheet());

    for (const section of sectionsOf(container)) {
      expect(section.hasAttribute('hidden')).toBe(false);
    }
  });

  it('should carry each anchor, so a link has something to point at', () => {
    const { container } = render(sheet());

    expect(sectionsOf(container).map((s) => s.dataset.anchor)).toEqual([
      'traits',
      'features',
      'deeds',
    ]);
  });
});

describe('the bar names where the reader is', () => {
  it('should name the first section to begin with', () => {
    const { container } = render(sheet());
    place(container, [LINE + 10, LINE + 400, LINE + 800]);
    expect(screen.getByRole('button', { name: 'Traits' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('should follow the reader down the page', () => {
    const { container } = render(sheet());

    place(container, [LINE - 900, LINE - 500, LINE - 100]);

    expect(screen.getByRole('button', { name: 'Deeds' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Traits' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('should name the last section to have passed the line', () => {
    const { container } = render(sheet());

    place(container, [LINE - 500, LINE - 100, LINE + 300]);

    expect(screen.getByRole('button', { name: 'Features' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('should name the last of them once the page can scroll no further', () => {
    const { container } = render(sheet());
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: SCREEN,
    });

    place(container, [LINE - 100, LINE + 200, LINE + 400]);

    expect(screen.getByRole('button', { name: 'Deeds' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('should take the reader to a section they ask for', () => {
    const { container } = render(sheet());
    const into = vi.fn();
    sectionsOf(container)[2].scrollIntoView = into;

    fireEvent.click(screen.getByRole('button', { name: 'Deeds' }));

    expect(into).toHaveBeenCalledTimes(1);
    expect(into.mock.calls[0][0]).toMatchObject({ block: 'start' });
  });
});
