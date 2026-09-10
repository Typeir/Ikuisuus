/**
 * @fileoverview watchVisible tests.
 * @module tests/unit/src/lib/utils/motion/watchVisible.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { watchVisible } from '@/lib/utils/motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Every observer built, with what it was told and what it watches. */
let built: Array<{
  margin: string | undefined;
  fire: (entries: IntersectionObserverEntry[]) => void;
  watching: Set<Element>;
  live: boolean;
}> = [];

beforeEach(() => {
  built = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      /** The record this observer writes itself into. */
      private readonly own: (typeof built)[number];

      /**
       * Joins the roster so a test can play sightings for it.
       *
       * @param {(entries: IntersectionObserverEntry[]) => void} fn - The callback.
       * @param {IntersectionObserverInit} [options] - How it was set up.
       */
      constructor(
        fn: (entries: IntersectionObserverEntry[]) => void,
        options?: IntersectionObserverInit,
      ) {
        this.own = {
          margin: options?.rootMargin,
          fire: fn,
          watching: new Set(),
          live: true,
        };
        built.push(this.own);
      }

      /**
       * Starts watching an element.
       *
       * @param {Element} target - The element to watch.
       * @returns {void} Nothing.
       */
      observe(target: Element): void {
        this.own.watching.add(target);
      }

      /**
       * Stops watching one element.
       *
       * @param {Element} target - The element to let go of.
       * @returns {void} Nothing.
       */
      unobserve(target: Element): void {
        this.own.watching.delete(target);
      }

      /**
       * Stops watching everything.
       *
       * @returns {void} Nothing.
       */
      disconnect(): void {
        this.own.live = false;
        this.own.watching.clear();
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * A fresh element in the document.
 *
 * @returns {HTMLElement} The element.
 */
const elementOf = (): HTMLElement => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
};

/**
 * Plays a sighting for one element on the observer that holds it.
 *
 * @param {Element} target - The element seen.
 * @param {boolean} near - Whether it is near the screen.
 * @returns {void} Nothing.
 */
const sight = (target: Element, near: boolean) => {
  for (const observer of built) {
    if (!observer.watching.has(target)) continue;
    observer.fire([
      { target, isIntersecting: near } as IntersectionObserverEntry,
    ]);
  }
};

describe('watchVisible', () => {
  it('should tell a watcher when its element comes near', () => {
    const heard = vi.fn();
    const el = elementOf();
    const stop = watchVisible(el, heard);

    sight(el, true);
    expect(heard).toHaveBeenCalledWith(true);
    stop();
  });

  it('should build one observer for many elements at one margin', () => {
    const stops = [0, 1, 2, 3].map(() => watchVisible(elementOf(), vi.fn()));

    expect(built).toHaveLength(1);
    for (const stop of stops) stop();
  });

  it('should tell each element only what was seen of it', () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = elementOf();
    const b = elementOf();
    const stops = [watchVisible(a, first), watchVisible(b, second)];

    sight(a, true);
    expect(first).toHaveBeenCalledWith(true);
    expect(second).not.toHaveBeenCalled();
    for (const stop of stops) stop();
  });

  it('should build a separate observer for a different margin', () => {
    const stops = [
      watchVisible(elementOf(), vi.fn(), '200px'),
      watchVisible(elementOf(), vi.fn(), '0px'),
    ];

    expect(built).toHaveLength(2);
    expect(built.map((o) => o.margin).sort()).toEqual(['0px', '200px']);
    for (const stop of stops) stop();
  });

  it('should let go of one element without disturbing the others', () => {
    const heard = vi.fn();
    const a = elementOf();
    const b = elementOf();
    const stopA = watchVisible(a, vi.fn());
    const stopB = watchVisible(b, heard);

    stopA();
    expect(built[0].live).toBe(true);
    sight(b, true);
    expect(heard).toHaveBeenCalledWith(true);
    stopB();
  });

  it('should disconnect once the last element lets go', () => {
    const stops = [
      watchVisible(elementOf(), vi.fn()),
      watchVisible(elementOf(), vi.fn()),
    ];

    stops[0]();
    expect(built[0].live).toBe(true);
    stops[1]();
    expect(built[0].live).toBe(false);
  });

  it('should build again after the last watcher had let go', () => {
    watchVisible(elementOf(), vi.fn())();
    watchVisible(elementOf(), vi.fn())();

    expect(built).toHaveLength(2);
  });

  it('should stop telling a watcher that let go', () => {
    const heard = vi.fn();
    const el = elementOf();
    const other = elementOf();
    const keep = watchVisible(other, vi.fn());
    watchVisible(el, heard)();

    sight(el, true);
    expect(heard).not.toHaveBeenCalled();
    keep();
  });

  it('should let a watcher stop itself from inside its own callback', () => {
    const el = elementOf();
    let stop = () => {};
    const heard = vi.fn(() => stop());
    stop = watchVisible(el, heard);

    sight(el, true);
    sight(el, true);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('should take a second stop quietly', () => {
    const stop = watchVisible(elementOf(), vi.fn());
    stop();
    expect(() => stop()).not.toThrow();
  });

  it('should count everything near when there is no observer to ask', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const heard = vi.fn();

    const stop = watchVisible(elementOf(), heard);
    expect(heard).toHaveBeenCalledWith(true);
    expect(() => stop()).not.toThrow();
  });

  it('should do nothing at all when handed no element', () => {
    const heard = vi.fn();
    const stop = watchVisible(null, heard);

    expect(heard).not.toHaveBeenCalled();
    expect(built).toHaveLength(0);
    expect(() => stop()).not.toThrow();
  });
});
