/**
 * @fileoverview Reports when a sticky element takes its ground.
 * @module lib/utils/motion/watchStuck
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { scrollParentOf } from '../scrollParentOf';

/**
 * Watches a sticky element and says when it reaches its resting line.
 *
 * @description The element itself is observed against a root pulled in past
 * where it rests, so a pinned element is no longer wholly inside and the ratio
 * leaves 1 at the moment it sticks. The rect check keeps an element still
 * arriving from below, also partly outside, from counting. Zero sits beside one
 * in the thresholds because arriving by a jump rather than a scroll takes the
 * element from outside the root straight to pinned, never passing through
 * wholly-inside.
 *
 * @param {HTMLElement | null} el - The sticky element.
 * @param {number} offset - Where it comes to rest, in pixels from the top.
 * @param {(stuck: boolean) => void} told - Given the answer on every change.
 * @returns {() => void} Stops watching.
 */
export function watchStuck(
  el: HTMLElement | null,
  offset: number,
  told: (stuck: boolean) => void,
): () => void {
  if (!el || typeof IntersectionObserver === 'undefined') return () => {};

  const edge = offset + 1;
  const observer = new IntersectionObserver(
    ([entry]) => {
      /* The element pins to the top of whatever it scrolls in, which is the
         viewport on a page and a container in a frame. `rootBounds` already
         carries the margin below, so it is the pin line in both. */
      const line = entry.rootBounds?.top ?? edge;
      told(
        entry.intersectionRatio < 1 && entry.boundingClientRect.top <= line,
      );
    },
    {
      root: scrollParentOf(el),
      threshold: [0, 1],
      rootMargin: `-${edge}px 0px 0px 0px`,
    },
  );

  observer.observe(el);
  return () => observer.disconnect();
}
