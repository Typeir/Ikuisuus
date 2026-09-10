/**
 * @fileoverview Runs a callback when the viewport moves or changes size.
 * @module lib/utils/motion/watchViewport
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { frameLoop, type FrameLoop } from './frameLoop';

/** Everyone watching, in the order they asked. */
const watchers = new Set<() => void>();

/** How many watchers asked for each event beyond scroll and resize. */
const asked = new Map<string, number>();

/** The one frame every watcher is read on. */
let loop: FrameLoop | null = null;

/**
 * Runs every watcher, once, on one frame.
 *
 * @returns {void} Nothing.
 */
function readAll(): void {
  for (const watcher of [...watchers]) watcher();
}

/**
 * Asks for the frame every watcher is read on.
 *
 * @returns {void} Nothing.
 */
function schedule(): void {
  loop?.schedule();
}

/**
 * Starts listening, once, for as long as anyone is watching.
 *
 * @returns {void} Nothing.
 */
function open(): void {
  if (loop) return;
  loop = frameLoop(readAll);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

/**
 * Stops listening once nobody is watching.
 *
 * @returns {void} Nothing.
 */
function close(): void {
  if (!loop || watchers.size > 0) return;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  loop.cancel();
  loop = null;
}

/**
 * Watches the viewport and runs a callback when something moved.
 *
 * @description Everyone watching shares one listener and one frame. Read on a
 * frame of its own, each watcher measures the page after the one before it has
 * finished with it, and the browser lays the page out again between every pair
 * of them; a page carrying a few of these pays that on every frame of scroll.
 * Read together, they measure once. The callback runs once at the start, since
 * a watcher that has never read is a watcher with nothing to say.
 *
 * @param {() => void} run - What to do when something moved.
 * @param {readonly string[]} [events] - Further window events to listen for.
 * @returns {() => void} Stops watching.
 */
export function watchViewport(
  run: () => void,
  events: readonly string[] = [],
): () => void {
  open();
  watchers.add(run);

  for (const name of events) {
    const held = asked.get(name) ?? 0;
    if (held === 0) window.addEventListener(name, schedule);
    asked.set(name, held + 1);
  }

  run();

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    watchers.delete(run);

    for (const name of events) {
      const held = (asked.get(name) ?? 1) - 1;
      if (held <= 0) {
        window.removeEventListener(name, schedule);
        asked.delete(name);
      } else {
        asked.set(name, held);
      }
    }

    close();
  };
}
