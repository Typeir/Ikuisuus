/**
 * @fileoverview Runs a callback when an element changes size.
 * @module lib/utils/motion/watchResize
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { frameLoop } from './frameLoop';

/**
 * Watches one element and runs a callback when its size changes.
 *
 * @description The callback runs once at the start, and every change after is
 * coalesced to one frame. Watching nothing is allowed and does nothing, so a
 * caller holding a element that may not be there need not guard the call.
 *
 * @param {Element | null} target - The element to watch.
 * @param {() => void} run - What to do when it changed.
 * @returns {() => void} Stops watching.
 */
export function watchResize(target: Element | null, run: () => void): () => void {
  if (!target || typeof ResizeObserver === 'undefined') return () => {};

  const loop = frameLoop(run);
  const observer = new ResizeObserver(loop.schedule);

  run();
  observer.observe(target);

  return () => {
    observer.disconnect();
    loop.cancel();
  };
}
