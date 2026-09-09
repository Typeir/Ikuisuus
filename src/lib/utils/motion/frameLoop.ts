/**
 * @fileoverview Coalesces repeated calls into one animation frame.
 * @module lib/utils/motion/frameLoop
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * A booking on the next frame.
 *
 * @property {() => void} schedule - Asks for a frame, ignored if one is booked.
 * @property {() => void} cancel - Drops a booked frame without running it.
 */
export interface FrameLoop {
  schedule: () => void;
  cancel: () => void;
}

/**
 * Runs a callback at most once per frame, however often it is asked.
 *
 * @description A scroll listener fires many times between paints, and reading
 * layout in each one costs a reflow that nothing sees.
 *
 * @param {() => void} run - What to do on the frame.
 * @returns {FrameLoop} The booking.
 */
export function frameLoop(run: () => void): FrameLoop {
  let frame: number | null = null;

  return {
    schedule: () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        run();
      });
    },
    cancel: () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
