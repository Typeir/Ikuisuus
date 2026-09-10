/**
 * @fileoverview Whether a reader has scrolled as far as they can.
 * @module lib/utils/atPageEnd
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

/**
 * How near the end counts as the end, in pixels.
 *
 * @description Zoom and fractional heights can leave the last pixel of a
 * scroll unreachable.
 */
const SLACK = 2;

/**
 * Whether the page can be scrolled no further.
 *
 * @description The last thing on a page is one a reader can never bring up to
 * the line they read at, because the page runs out before it gets there. Where
 * a reader is taken to be is answered against that line everywhere else, so
 * everywhere else has to answer this the same way: a reader who cannot scroll
 * further has reached whatever is last.
 *
 * @param {number} scrolled - How far the page has been scrolled.
 * @param {number} screen - Height of the screen, in pixels.
 * @param {number} page - Height of the whole page, in pixels.
 * @param {number} [slack] - How near the end counts as the end.
 * @returns {boolean} True when there is nothing left to scroll.
 */
export function atPageEnd(
  scrolled: number,
  screen: number,
  page: number,
  slack: number = SLACK,
): boolean {
  if (!Number.isFinite(scrolled) || !Number.isFinite(screen)) return false;
  if (!Number.isFinite(page) || page <= 0) return false;

  return scrolled + screen >= page - slack;
}
