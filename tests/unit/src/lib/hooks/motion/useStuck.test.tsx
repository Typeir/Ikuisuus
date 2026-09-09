/**
 * @fileoverview useStuck tests.
 * @module tests/unit/src/lib/hooks/motion/useStuck.test
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 *
 * @description What the watcher does is proved against a fake DOM in
 * `lib/utils/motion`. What is proved here is the binding, and the one thing
 * only React can do: putting the answer where a render can read it.
 */

import { act, render } from '@testing-library/react';
import React, { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stop, watchStuck } = vi.hoisted(() => ({
  stop: vi.fn(),
  watchStuck: vi.fn(),
}));

vi.mock('@/lib/utils/motion', () => ({ watchStuck }));

const { useStuck } = await import('@/lib/hooks/motion/useStuck');

beforeEach(() => {
  stop.mockClear();
  watchStuck.mockClear();
  watchStuck.mockReturnValue(stop);
});

/** What the hook last reported, for the test to read. */
let seen: { stuck: boolean; pinned: React.RefObject<boolean> };

/**
 * A strip that reports whether it has taken its ground.
 *
 * @param {object} props - Component props.
 * @param {number} props.offset - Where it comes to rest.
 * @returns {React.JSX.Element} The strip.
 */
const Probe = ({ offset }: { offset: number }): React.JSX.Element => {
  const row = useRef<HTMLDivElement>(null);
  seen = useStuck(row, offset);
  return <div ref={row} data-stuck={seen.stuck ? 'true' : undefined} />;
};

/**
 * Plays an answer from the watcher.
 *
 * @param {boolean} on - Whether it is pinned.
 * @returns {void} Nothing.
 */
const says = (on: boolean) => {
  act(() => watchStuck.mock.calls[0][2](on));
};

describe('useStuck', () => {
  it('should start unstuck, before the watcher has said anything', () => {
    render(<Probe offset={0} />);

    expect(seen.stuck).toBe(false);
    expect(seen.pinned.current).toBe(false);
  });

  it('should watch the element it was handed, at the offset given', () => {
    const { container } = render(<Probe offset={60} />);

    expect(watchStuck.mock.calls[0][0]).toBe(container.firstElementChild);
    expect(watchStuck.mock.calls[0][1]).toBe(60);
  });

  it('should put the answer where a render can read it', () => {
    const { container } = render(<Probe offset={0} />);
    says(true);

    expect(seen.stuck).toBe(true);
    expect(container.firstElementChild).toHaveAttribute('data-stuck', 'true');
  });

  it('should put the answer in the ref as well, for an effect to read', () => {
    render(<Probe offset={0} />);
    says(true);

    expect(seen.pinned.current).toBe(true);
  });

  it('should let go when the watcher says so', () => {
    render(<Probe offset={0} />);
    says(true);
    says(false);

    expect(seen.stuck).toBe(false);
    expect(seen.pinned.current).toBe(false);
  });

  it('should stop the watcher on unmount', () => {
    render(<Probe offset={0} />).unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('should start over when the resting line moves', () => {
    const { rerender } = render(<Probe offset={0} />);
    rerender(<Probe offset={60} />);

    expect(stop).toHaveBeenCalledTimes(1);
    expect(watchStuck).toHaveBeenCalledTimes(2);
    expect(watchStuck.mock.calls[1][1]).toBe(60);
  });
});
