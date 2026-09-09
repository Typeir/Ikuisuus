/**
 * @fileoverview useViewportSignal tests.
 * @module tests/unit/src/lib/hooks/motion/useViewportSignal.test
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 *
 * @description What the watcher does is proved against a fake DOM in
 * `lib/utils/motion`. What is proved here is the binding: the watcher is
 * started once, told the right things, and stopped when the component goes.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stop, watchViewport } = vi.hoisted(() => ({
  stop: vi.fn(),
  watchViewport: vi.fn(),
}));

vi.mock('@/lib/utils/motion', () => ({ watchViewport }));

const { useViewportSignal } = await import(
  '@/lib/hooks/motion/useViewportSignal'
);

beforeEach(() => {
  stop.mockClear();
  watchViewport.mockClear();
  watchViewport.mockReturnValue(stop);
});

describe('useViewportSignal', () => {
  it('should start one watcher on mount', () => {
    /**
     * Watches the viewport.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useViewportSignal(vi.fn());
      return null;
    };
    render(<Probe />);

    expect(watchViewport).toHaveBeenCalledTimes(1);
  });

  it('should pass on the events it was asked to watch', () => {
    /**
     * Watches the viewport and one page event.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useViewportSignal(vi.fn(), ['ik:content-changed']);
      return null;
    };
    render(<Probe />);

    expect(watchViewport.mock.calls[0][1]).toEqual(['ik:content-changed']);
  });

  it('should stop the watcher on unmount', () => {
    /**
     * Watches the viewport.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useViewportSignal(vi.fn());
      return null;
    };
    render(<Probe />).unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('should keep one watcher across renders that change nothing', () => {
    /**
     * Watches the viewport, handed a fresh array each render.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useViewportSignal(vi.fn(), ['ik:content-changed']);
      return null;
    };
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    rerender(<Probe />);

    expect(watchViewport).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
  });

  it('should call the newest callback, not the one it started with', () => {
    const first = vi.fn();
    const second = vi.fn();

    /**
     * Takes whichever callback it is handed this render.
     *
     * @param {object} props - Component props.
     * @param {() => void} props.run - The callback of the moment.
     * @returns {null} Nothing rendered.
     */
    const Probe = ({ run }: { run: () => void }) => {
      useViewportSignal(run);
      return null;
    };
    const { rerender } = render(<Probe run={first} />);
    rerender(<Probe run={second} />);

    watchViewport.mock.calls[0][0]();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
