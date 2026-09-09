/**
 * @fileoverview sheetMeasure tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetMeasure.test
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 */

import { measureSheet } from '@/modules/library/presentation/components/slots/sheetMeasure';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The run holding the page. */
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
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect }) as DOMRect;
};

beforeEach(() => {
  document.body.innerHTML = '';
  box = document.createElement('div');
  shelf = document.createElement('div');
  shelf.appendChild(box);
  document.body.appendChild(shelf);

  rects(box, { bottom: 800, left: 100, right: 700 });
  vi.stubGlobal('innerHeight', 900);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 1000,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('measureSheet', () => {
  it('should hold the run short of the page bottom', () => {
    measureSheet(box, shelf);
    expect(shelf.style.getPropertyValue('--sheet-trailing')).toBe('200px');
  });

  it('should take back the padding it has already paid out', () => {
    measureSheet(box, shelf);
    const first = shelf.style.getPropertyValue('--sheet-trailing');

    /* The sheet pays the trailing space out as its own padding, which the
       next reading would otherwise find and add again. */
    shelf.style.paddingBlockEnd = first;
    measureSheet(box, shelf);

    expect(shelf.style.getPropertyValue('--sheet-trailing')).toBe('0px');
  });

  it('should settle rather than grow when measured over and over', () => {
    for (let pass = 0; pass < 8; pass += 1) {
      measureSheet(box, shelf);
      shelf.style.paddingBlockEnd =
        shelf.style.getPropertyValue('--sheet-trailing');
    }
    expect(shelf.style.getPropertyValue('--sheet-trailing')).toBe('0px');
  });

  it('should never claim more than a screen of trailing space', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 99999,
    });
    measureSheet(box, shelf);
    expect(shelf.style.getPropertyValue('--sheet-trailing')).toBe('900px');
  });

  it('should never claim a negative amount', () => {
    rects(box, { bottom: 5000, left: 100, right: 700 });
    measureSheet(box, shelf);
    expect(shelf.style.getPropertyValue('--sheet-trailing')).toBe('0px');
  });

  it('should reach the page edges and no further', () => {
    measureSheet(box, shelf);
    expect(shelf.style.getPropertyValue('--sheet-bleed-start')).toBe('100px');
    expect(shelf.style.getPropertyValue('--sheet-bleed-end')).toBe('300px');
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

  it('should leave the stylesheet its fallback when a bar is absent', () => {
    measureSheet(box, shelf);
    expect(shelf.style.getPropertyValue('--sheet-headline')).toBe('');
    expect(shelf.style.getPropertyValue('--sheet-footline')).toBe('');
  });
});
