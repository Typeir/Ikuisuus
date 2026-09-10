/**
 * @fileoverview sheetSpy tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetSpy.test
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 *
 * @description One reading of the page answers both questions, so both are
 * asked of the same placement here: which section has passed the line a reader
 * reads at, and how much of the sheet is behind it.
 */

import { READING_LINE } from '@/lib/constants/reading';
import { act, cleanup, render } from '@testing-library/react';
import React, { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { watchViewport, stop } = vi.hoisted(() => ({
  watchViewport: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('@/lib/utils/motion', async (real) => ({
  ...(await real<typeof import('@/lib/utils/motion')>()),
  watchViewport,
}));

const { useSheetSpy } = await import(
  '@/modules/library/presentation/components/slots/sheetSpy'
);

/** What the hook last reported. */
let seen = 0;

/** How tall the screen is taken to be. */
const SCREEN = 800;

/** Where down that screen a reader is taken to be reading. */
const LINE = SCREEN * READING_LINE;

/**
 * A sheet whose sections can be placed down the page.
 *
 * @param {object} props - Component props.
 * @param {number} props.sections - How many sections it holds.
 * @returns {React.JSX.Element} The sheet.
 */
const Probe = ({ sections }: { sections: number }): React.JSX.Element => {
  const rack = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  seen = useSheetSpy(rack, bar, shell, sections);

  return (
    <div ref={shell} data-testid='shell'>
      <div ref={bar} data-testid='bar' />
      <div ref={rack} data-testid='rack'>
        {Array.from({ length: sections }, (_, i) => (
          <div key={i} data-sheet-page />
        ))}
      </div>
    </div>
  );
};

/**
 * Gives an element a top edge to report.
 *
 * @param {Element} el - The element.
 * @param {number} top - Where its top edge sits.
 * @param {number} height - How tall it is.
 * @returns {void} Nothing.
 */
const place = (el: Element, top: number, height: number) => {
  el.getBoundingClientRect = () =>
    ({ top, height, bottom: top + height }) as DOMRect;
};

/**
 * Stands a sheet up with its sections at the given heights, and reads it.
 *
 * @param {number[]} tops - Where each section's top edge sits.
 * @param {object} [sheet] - Where the sheet itself stands.
 * @param {number} sheet.top - Its top edge.
 * @param {number} sheet.height - Its height.
 * @returns {HTMLElement} The bar the progress is written on.
 */
const standing = (
  tops: number[],
  sheet: { top: number; height: number } = { top: 0, height: 2000 },
): HTMLElement => {
  cleanup();
  const view = render(<Probe sections={tops.length} />);

  place(view.getByTestId('shell'), sheet.top, sheet.height);
  const rack = view.getByTestId('rack');
  tops.forEach((top, index) => place(rack.children[index], top, 400));

  const latest = watchViewport.mock.calls.at(-1);
  act(() => latest?.[0]());
  return view.getByTestId('bar');
};

/**
 * How far the bar says the reader has come.
 *
 * @param {HTMLElement} bar - The bar.
 * @returns {number} Nought to one.
 */
const read = (bar: HTMLElement): number =>
  Number(bar.style.getPropertyValue('--sheet-read'));

beforeEach(() => {
  stop.mockClear();
  watchViewport.mockClear();
  watchViewport.mockReturnValue(stop);
  vi.stubGlobal('innerHeight', SCREEN);
  vi.stubGlobal('scrollY', 0);
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 100000,
  });
});

describe('the section the reader has reached', () => {
  it('should be the first before anything has passed the line', () => {
    standing([LINE + 10, LINE + 400, LINE + 800]);
    expect(seen).toBe(0);
  });

  it('should be the last one to have passed the line', () => {
    standing([LINE - 500, LINE - 100, LINE + 300]);
    expect(seen).toBe(1);
  });

  it('should follow the reader down the sheet', () => {
    standing([LINE - 900, LINE - 500, LINE - 100]);
    expect(seen).toBe(2);
  });

  it('should count a section resting exactly on the line as passed', () => {
    standing([LINE - 400, LINE]);
    expect(seen).toBe(1);
  });

  /* The page runs out before the last section of a short sheet can be
     brought up to the line, and a reader who cannot scroll further has
     finished it. */
  it('should be the last section once the page can scroll no further', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: SCREEN,
    });
    standing([LINE - 100, LINE + 200, LINE + 400]);
    expect(seen).toBe(2);
  });

  it('should say nothing of a sheet holding one section', () => {
    standing([LINE - 100]);
    expect(seen).toBe(0);
    expect(watchViewport).not.toHaveBeenCalled();
  });
});

describe('how far through the sheet the reader has come', () => {
  it('should read nothing before the sheet has reached the line', () => {
    expect(read(standing([0, 0], { top: SCREEN, height: 2000 }))).toBe(0);
  });

  it('should count how much of the sheet is behind the line', () => {
    expect(read(standing([0, 0], { top: LINE - 500, height: 2000 }))).toBe(
      0.25,
    );
  });

  /* Counted against the whole sheet: measured against only what will not fit
     the screen, a sheet barely taller than one would fill inside its first
     section and stay full for the rest of itself. */
  it('should still be reading partway through a barely tall sheet', () => {
    const through = read(standing([0, 0], { top: LINE - 250, height: 1000 }));
    expect(through).toBeGreaterThan(0.2);
    expect(through).toBeLessThan(0.3);
  });

  it('should be full once the sheet has passed the line', () => {
    expect(read(standing([0, 0], { top: LINE - 4000, height: 2000 }))).toBe(1);
  });

  /* The same rule that makes the last section the one being read there: what
     is left of the sheet is behind a line the reader can no longer reach. */
  it('should be full once the page can scroll no further', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: SCREEN,
    });
    expect(read(standing([0, 0], { top: LINE - 100, height: 4000 }))).toBe(1);
  });

  it('should say nothing about a sheet with no height to speak of', () => {
    expect(read(standing([0, 0], { top: 0, height: 0 }))).toBe(0);
  });
});

describe('what the sheet never does', () => {
  it('should never take hold of the scroll, only read it', () => {
    const scrolled = vi.fn();
    vi.stubGlobal('scrollTo', scrolled);
    standing([LINE - 100, LINE + 100]);

    expect(scrolled).not.toHaveBeenCalled();
  });

  it('should read the page on one watcher, not one for each section', () => {
    standing([0, 0, 0, 0, 0]);
    expect(watchViewport).toHaveBeenCalledTimes(1);
  });

  it('should stop watching once it is taken away', () => {
    render(<Probe sections={3} />).unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
