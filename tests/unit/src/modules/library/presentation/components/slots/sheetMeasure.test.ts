/**
 * @fileoverview sheetMeasure tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetMeasure.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 *
 * @description What the sheet reads off the page it is laid on: how far its
 * header's ground has to reach to meet the edges, and how tall the layout's
 * own bars are. Both are covers, and a cover that falls a fraction short is a
 * hairline of the page showing through.
 */

import { measureSheet } from '@/modules/library/presentation/components/slots/sheetMeasure';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The run holding the sections. */
let box: HTMLElement;

/** The sheet root the properties are written on. */
let shelf: HTMLElement;

/**
 * Gives an element a fixed rectangle to report.
 *
 * @param {HTMLElement} el - The element.
 * @param {Partial<DOMRect>} rect - What it should report.
 * @returns {void} Nothing.
 */
const rects = (el: HTMLElement, rect: Partial<DOMRect>) => {
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      ...rect,
    }) as DOMRect;
};

beforeEach(() => {
  document.body.innerHTML = '';
  box = document.createElement('div');
  shelf = document.createElement('div');
  shelf.appendChild(box);
  document.body.appendChild(shelf);

  rects(box, { left: 100, right: 700 });
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('measureSheet', () => {
  it('should reach the page edges and no further', () => {
    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-bleed-start')).toBe('100px');
    expect(shelf.style.getPropertyValue('--sheet-bleed-end')).toBe('300px');
  });

  it('should round a reach up, so no hairline is left uncovered', () => {
    rects(box, { left: 100.2, right: 699.4 });
    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-bleed-start')).toBe('101px');
    expect(shelf.style.getPropertyValue('--sheet-bleed-end')).toBe('301px');
  });

  it('should never reach backwards off a page wider than the screen', () => {
    rects(box, { left: -40, right: 1400 });
    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-bleed-start')).toBe('0px');
    expect(shelf.style.getPropertyValue('--sheet-bleed-end')).toBe('0px');
  });

  it('should read both of the layout bars it stands level with', () => {
    for (const [cls, height] of [
      ['sidebar-header', 52],
      ['sidebar-footer', 40],
    ] as const) {
      const bar = document.createElement('div');
      bar.className = cls;
      rects(bar, { height });
      document.body.appendChild(bar);
    }

    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-headline')).toBe('52px');
    expect(shelf.style.getPropertyValue('--sheet-footline')).toBe('40px');
  });

  it('should round a bar up rather than end a rule short of it', () => {
    const bar = document.createElement('div');
    bar.className = 'sidebar-header';
    rects(bar, { height: 51.3 });
    document.body.appendChild(bar);

    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-headline')).toBe('52px');
  });

  it('should leave the stylesheet its fallback when a bar is absent', () => {
    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-headline')).toBe('');
    expect(shelf.style.getPropertyValue('--sheet-footline')).toBe('');
  });
});
