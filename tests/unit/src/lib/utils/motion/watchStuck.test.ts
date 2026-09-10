/**
 * @fileoverview watchStuck tests.
 * @module tests/unit/src/lib/utils/motion/watchStuck.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { watchStuck } from '@/lib/utils/motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** What the live observer was told, so a test can play the scroll for it. */
let told: ((entries: IntersectionObserverEntry[]) => void) | null = null;

/** The options the observer was built with. */
let built: IntersectionObserverInit | undefined;

/** How many observers were disconnected. */
let disconnected = 0;

beforeEach(() => {
  told = null;
  built = undefined;
  disconnected = 0;

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      /**
       * Remembers the callback and the options for the test to inspect.
       *
       * @param {(entries: IntersectionObserverEntry[]) => void} fn - The callback.
       * @param {IntersectionObserverInit} [options] - How it was set up.
       */
      constructor(
        fn: (entries: IntersectionObserverEntry[]) => void,
        options?: IntersectionObserverInit,
      ) {
        told = fn;
        built = options;
      }

      /**
       * Starts watching.
       *
       * @returns {void} Nothing.
       */
      observe(): void {}

      /**
       * Stops watching.
       *
       * @returns {void} Nothing.
       */
      disconnect(): void {
        disconnected += 1;
      }

      /**
       * Stops watching one element.
       *
       * @returns {void} Nothing.
       */
      unobserve(): void {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Plays one observation for the watched element.
 *
 * @param {number} ratio - How much of it is inside the root.
 * @param {number} top - Where its top edge sits.
 * @param {number | null} line - The root's own top edge, or null when absent.
 * @returns {void} Nothing.
 */
const observe = (ratio: number, top: number, line: number | null = 0) => {
  told?.([
    {
      intersectionRatio: ratio,
      boundingClientRect: { top } as DOMRectReadOnly,
      rootBounds: line === null ? null : ({ top: line } as DOMRectReadOnly),
    } as IntersectionObserverEntry,
  ]);
};

describe('watchStuck', () => {
  /** The element being watched. */
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('should count an element held at the pin line as stuck', () => {
    const heard = vi.fn();
    const stop = watchStuck(el, 0, heard);

    observe(0.5, -4);
    expect(heard).toHaveBeenCalledWith(true);
    stop();
  });

  it('should not count an element still arriving from below', () => {
    const heard = vi.fn();
    const stop = watchStuck(el, 0, heard);

    observe(0.5, 500);
    expect(heard).toHaveBeenCalledWith(false);
    stop();
  });

  it('should not count an element wholly inside the root', () => {
    const heard = vi.fn();
    const stop = watchStuck(el, 0, heard);

    observe(1, -4);
    expect(heard).toHaveBeenCalledWith(false);
    stop();
  });

  it('should let go once the element returns to its place', () => {
    const heard = vi.fn();
    const stop = watchStuck(el, 0, heard);

    observe(0.5, -4);
    observe(1, 40);
    expect(heard).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('should fall back to the offset when the root has no bounds', () => {
    const heard = vi.fn();
    const stop = watchStuck(el, 60, heard);

    observe(0.5, 61, null);
    expect(heard).toHaveBeenCalledWith(true);
    stop();
  });

  it('should pull the root in by the offset and watch both edges', () => {
    const stop = watchStuck(el, 60, vi.fn());

    expect(built?.rootMargin).toBe('-61px 0px 0px 0px');
    expect(built?.threshold).toEqual([0, 1]);
    stop();
  });

  it('should do nothing at all when handed no element', () => {
    const heard = vi.fn();
    const stop = watchStuck(null, 0, heard);

    expect(told).toBeNull();
    expect(heard).not.toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
  });

  it('should disconnect once stopped', () => {
    watchStuck(el, 0, vi.fn())();
    expect(disconnected).toBe(1);
  });
});
