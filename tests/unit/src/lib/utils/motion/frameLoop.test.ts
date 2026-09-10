/**
 * @fileoverview frameLoop tests.
 * @module tests/unit/src/lib/utils/motion/frameLoop.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { frameLoop } from '@/lib/utils/motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Frames asked for, each held until the test lets it run. */
let frames: FrameRequestCallback[] = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.push(fn);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames[id - 1] = () => {};
  });
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

describe('frameLoop', () => {
  it('should run once however many times it is asked in one frame', () => {
    const run = vi.fn();
    const loop = frameLoop(run);

    loop.schedule();
    loop.schedule();
    loop.schedule();
    expect(run).not.toHaveBeenCalled();

    flush();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('should book another frame once the first has run', () => {
    const run = vi.fn();
    const loop = frameLoop(run);

    loop.schedule();
    flush();
    loop.schedule();
    flush();

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('should not run a frame that was cancelled', () => {
    const run = vi.fn();
    const loop = frameLoop(run);

    loop.schedule();
    loop.cancel();
    flush();

    expect(run).not.toHaveBeenCalled();
  });

  it('should book again after a cancel', () => {
    const run = vi.fn();
    const loop = frameLoop(run);

    loop.schedule();
    loop.cancel();
    loop.schedule();
    flush();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('should let a cancel with nothing booked pass quietly', () => {
    expect(() => frameLoop(vi.fn()).cancel()).not.toThrow();
  });
});
