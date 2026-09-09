/**
 * @fileoverview watchResize tests.
 * @module tests/unit/src/lib/utils/motion/watchResize.test
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 */

import { watchResize } from '@/lib/utils/motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Frames asked for, each held until the test lets it run. */
let frames: FrameRequestCallback[] = [];

/** What each live observer watches, and what it calls on a change. */
let observers: Array<{ target: Element; fire: () => void }> = [];

/** How many observers were disconnected. */
let disconnected = 0;

beforeEach(() => {
  frames = [];
  observers = [];
  disconnected = 0;

  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.push(fn);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames[id - 1] = () => {};
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      /** What this observer calls when its target changes size. */
      private readonly told: () => void;

      /**
       * Remembers the callback.
       *
       * @param {() => void} told - What to call on a change.
       */
      constructor(told: () => void) {
        this.told = told;
      }

      /**
       * Starts watching an element.
       *
       * @param {Element} target - The element to watch.
       * @returns {void} Nothing.
       */
      observe(target: Element): void {
        observers.push({ target, fire: this.told });
      }

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

/** Runs every frame asked for so far. */
const flush = () => {
  const due = frames;
  frames = [];
  for (const fn of due) fn(0);
};

describe('watchResize', () => {
  it('should read once at the start without waiting for a frame', () => {
    const run = vi.fn();
    const stop = watchResize(document.body, run);

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should watch the element it was handed', () => {
    const stop = watchResize(document.body, vi.fn());

    expect(observers).toHaveLength(1);
    expect(observers[0].target).toBe(document.body);
    stop();
  });

  it('should coalesce a burst of size changes into one read', () => {
    const run = vi.fn();
    const stop = watchResize(document.body, run);
    run.mockClear();

    for (let i = 0; i < 4; i += 1) observers[0].fire();
    flush();

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should do nothing at all when handed no element', () => {
    const run = vi.fn();
    const stop = watchResize(null, run);

    expect(run).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
    expect(() => stop()).not.toThrow();
  });

  it('should disconnect once stopped', () => {
    watchResize(document.body, vi.fn())();
    expect(disconnected).toBe(1);
  });

  it('should drop a frame booked before it was stopped', () => {
    const run = vi.fn();
    const stop = watchResize(document.body, run);
    run.mockClear();

    observers[0].fire();
    stop();
    flush();

    expect(run).not.toHaveBeenCalled();
  });
});
