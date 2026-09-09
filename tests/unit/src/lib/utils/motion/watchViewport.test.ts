/**
 * @fileoverview watchViewport tests.
 * @module tests/unit/src/lib/utils/motion/watchViewport.test
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 */

import { watchViewport } from '@/lib/utils/motion';
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

describe('watchViewport', () => {
  it('should read once at the start without waiting for a frame', () => {
    const run = vi.fn();
    const stop = watchViewport(run);

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should coalesce a burst of scrolls into one read', () => {
    const run = vi.fn();
    const stop = watchViewport(run);
    run.mockClear();

    for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event('scroll'));
    flush();

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should answer resize as well as scroll', () => {
    const run = vi.fn();
    const stop = watchViewport(run);
    run.mockClear();

    window.dispatchEvent(new Event('resize'));
    flush();

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should answer a named event it was asked to watch', () => {
    const run = vi.fn();
    const stop = watchViewport(run, ['ik:content-changed']);
    run.mockClear();

    window.dispatchEvent(new Event('ik:content-changed'));
    flush();

    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });

  it('should ignore a named event it was not asked to watch', () => {
    const run = vi.fn();
    const stop = watchViewport(run);
    run.mockClear();

    window.dispatchEvent(new Event('ik:content-changed'));
    flush();

    expect(run).not.toHaveBeenCalled();
    stop();
  });

  it('should stop listening once stopped', () => {
    const run = vi.fn();
    const stop = watchViewport(run, ['ik:content-changed']);
    run.mockClear();
    stop();

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('ik:content-changed'));
    flush();

    expect(run).not.toHaveBeenCalled();
  });

  it('should drop a frame booked before it was stopped', () => {
    const run = vi.fn();
    const stop = watchViewport(run);
    run.mockClear();

    window.dispatchEvent(new Event('scroll'));
    stop();
    flush();

    expect(run).not.toHaveBeenCalled();
  });
});
