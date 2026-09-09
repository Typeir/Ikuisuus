/**
 * @fileoverview Keeps a sheet's unread pages present, hidden, and reachable.
 * @module modules/library/presentation/components/slots/sheetPresence
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { REVEAL_EVENT } from '@/lib/constants/domEvents';
import { useEffect, useLayoutEffect } from 'react';
import type { RefObject } from 'react';

/**
 * The `hidden` value that leaves content reachable by find-in-page.
 *
 * @description The platform answers this third value with
 * `content-visibility` rather than `display: none`, which is what lets
 * find-in-page reach inside and announce itself first.
 */
const UNTIL_FOUND = 'until-found';

/**
 * Hides every page of a stack but the ones named.
 *
 * @description React writes `hidden` as a flag, so the attribute is set here
 * rather than rendered. Nothing flashes for want of it before this runs: the
 * stylesheet already holds every page but one out of sight.
 *
 * @param {Element} stack - The element holding the pages.
 * @param {ReadonlyArray<number>} open - Which of them stay visible.
 * @returns {void} Nothing.
 */
export function hidePages(stack: Element, open: ReadonlyArray<number>): void {
  const pages = stack.children;
  for (let index = 0; index < pages.length; index += 1) {
    if (open.includes(index)) pages[index].removeAttribute('hidden');
    else pages[index].setAttribute('hidden', UNTIL_FOUND);
  }
}

/**
 * Which page of a stack an event came from.
 *
 * @param {Element} stack - The element holding the pages.
 * @param {Event} event - What was raised inside one of them.
 * @returns {number} Its index, or -1 when the event came from elsewhere.
 */
export function pageAsked(stack: Element, event: Event): number {
  const page = (event.target as HTMLElement | null)?.closest(
    '[data-sheet-page]',
  );
  if (!page) return -1;
  return Array.prototype.indexOf.call(stack.children, page);
}

/**
 * Keeps the unread pages hidden, and turns to one that is asked for.
 *
 * @description A page nobody is reading is hidden rather than taken away, so
 * find-in-page can reach into it and an anchor has something to point at. The
 * browser takes the attribute off itself before it scrolls to a match, and
 * React would put it straight back on the next render, so the sheet is told to
 * turn to that page and keep it shown. An anchor asks the same way, and the
 * ask bubbles, so a page nested inside another page is reached by one dispatch.
 *
 * @param {RefObject<HTMLElement | null>} rack - The element holding the pages.
 * @param {number} active - The page being read.
 * @param {number | null} leaving - The page fading out, if any.
 * @param {(index: number) => void} turn - Asks the sheet for another page.
 * @returns {void} Nothing.
 */
export function usePagePresence(
  rack: RefObject<HTMLElement | null>,
  active: number,
  leaving: number | null,
  turn: (index: number) => void,
): void {
  useLayoutEffect(() => {
    const stack = rack.current;
    if (stack) hidePages(stack, leaving === null ? [active] : [active, leaving]);
  });

  useEffect(() => {
    const stack = rack.current;
    if (!stack) return;

    const reveal = (event: Event) => {
      const at = pageAsked(stack, event);
      if (at >= 0 && at !== active) turn(at);
    };

    stack.addEventListener('beforematch', reveal);
    stack.addEventListener(REVEAL_EVENT, reveal);
    return () => {
      stack.removeEventListener('beforematch', reveal);
      stack.removeEventListener(REVEAL_EVENT, reveal);
    };
  }, [rack, active, turn]);
}
