/**
 * @fileoverview useFrameLoop tests.
 * @module tests/unit/src/lib/hooks/motion/useFrameLoop.test
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 *
 * @description What the loop does is proved against a fake clock in
 * `lib/utils/motion`. What is proved here is the binding.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cancel, frameLoop, schedule } = vi.hoisted(() => ({
  cancel: vi.fn(),
  frameLoop: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock('@/lib/utils/motion', () => ({ frameLoop }));

const { useFrameLoop } = await import('@/lib/hooks/motion/useFrameLoop');

beforeEach(() => {
  cancel.mockClear();
  frameLoop.mockClear();
  schedule.mockClear();
  frameLoop.mockReturnValue({ schedule, cancel });
});

describe('useFrameLoop', () => {
  it('should hand back the scheduler', () => {
    let ask: () => void = () => {};

    /**
     * Hands the scheduler out for the test to call.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      ask = useFrameLoop(vi.fn());
      return null;
    };
    render(<Probe />);
    ask();

    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('should build one loop across renders', () => {
    /**
     * Takes a fresh closure each render.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useFrameLoop(vi.fn());
      return null;
    };
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    rerender(<Probe />);

    expect(frameLoop).toHaveBeenCalledTimes(1);
  });

  it('should drop a booked frame on unmount', () => {
    /**
     * Books frames until it goes away.
     *
     * @returns {null} Nothing rendered.
     */
    const Probe = () => {
      useFrameLoop(vi.fn());
      return null;
    };
    render(<Probe />).unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('should run the newest callback, not the one it was built with', () => {
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
      useFrameLoop(run);
      return null;
    };
    const { rerender } = render(<Probe run={first} />);
    rerender(<Probe run={second} />);

    frameLoop.mock.calls[0][0]();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
