/**
 * @fileoverview Runs a callback when the viewport moves or changes size.
 * @module lib/utils/motion/watchViewport
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { frameLoop } from './frameLoop';

/**
 * Watches the viewport and runs a callback when something moved.
 *
 * @description Every signal is coalesced to one frame, so a burst of scroll
 * events and a resize in the same frame read layout once between them. The
 * callback runs once at the start, since a watcher that has never read is a
 * watcher with nothing to say.
 *
 * @param {() => void} run - What to do when something moved.
 * @param {readonly string[]} [events] - Further window events to listen for.
 * @returns {() => void} Stops watching.
 */
export function watchViewport(
  run: () => void,
  events: readonly string[] = [],
): () => void {
  const loop = frameLoop(run);
  const { schedule } = loop;

  run();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  for (const name of events) window.addEventListener(name, schedule);

  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    for (const name of events) window.removeEventListener(name, schedule);
    loop.cancel();
  };
}
