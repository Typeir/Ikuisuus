/**
 * @fileoverview useResizeSignal tests.
 * @module tests/unit/src/lib/hooks/motion/useResizeSignal.test
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 *
 * @description What the watcher does is proved against a fake DOM in
 * `lib/utils/motion`. What is proved here is the binding.
 */

import { render } from '@testing-library/react';
import React, { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stop, watchResize } = vi.hoisted(() => ({
  stop: vi.fn(),
  watchResize: vi.fn(),
}));

vi.mock('@/lib/utils/motion', () => ({ watchResize }));

const { useResizeSignal } = await import('@/lib/hooks/motion/useResizeSignal');

beforeEach(() => {
  stop.mockClear();
  watchResize.mockClear();
  watchResize.mockReturnValue(stop);
});

describe('useResizeSignal', () => {
  it('should start one watcher on mount', () => {
    /**
     * Watches the document body.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useResizeSignal(() => document.body, vi.fn());
      return null;
    };
    render(<Probe />);

    expect(watchResize).toHaveBeenCalledTimes(1);
    expect(watchResize.mock.calls[0][0]).toBe(document.body);
  });

  it('should resolve the target after refs are filled', () => {
    /**
     * Watches an element it renders itself.
     *
     * @returns {React.JSX.Element} The watched element.
     */
    const Probe = (): React.JSX.Element => {
      const box = useRef<HTMLDivElement>(null);
      useResizeSignal(() => box.current, vi.fn());
      return <div ref={box} data-testid='box' />;
    };
    const { getByTestId } = render(<Probe />);

    expect(watchResize.mock.calls[0][0]).toBe(getByTestId('box'));
  });

  it('should stop the watcher on unmount', () => {
    /**
     * Watches the document body.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useResizeSignal(() => document.body, vi.fn());
      return null;
    };
    render(<Probe />).unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('should keep one watcher across renders', () => {
    /**
     * Watches the document body, handed fresh closures each render.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useResizeSignal(() => document.body, vi.fn());
      return null;
    };
    const { rerender } = render(<Probe />);
    rerender(<Probe />);

    expect(watchResize).toHaveBeenCalledTimes(1);
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
      useResizeSignal(() => document.body, run);
      return null;
    };
    const { rerender } = render(<Probe run={first} />);
    rerender(<Probe run={second} />);

    watchResize.mock.calls[0][1]();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
