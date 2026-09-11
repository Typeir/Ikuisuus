/**
 * @fileoverview Scroll progress tracking hook for library navigation components.
 * @module modules/library/application/hooks/useScrollProgress
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

'use client';

import { DETAILS_OPENED_EVENT } from '@/lib/constants/domEvents';
import { useViewportSignal } from '@/lib/hooks/motion';
import { useRef, useState } from 'react';

/**
 * Return type for the `useScrollProgress` hook.
 *
 * @property {number} scrollY - Current vertical scroll position (px).
 * @property {number} viewportH - Viewport height (px).
 * @property {number} docH - Total document height (px).
 * @property {number} scrollPercent - Normalized scroll progress (0–1).
 */
interface ScrollProgress {
  scrollY: number;
  viewportH: number;
  docH: number;
  scrollPercent: number;
}

/** Initialises scroll state from the live DOM, or zeroes for SSR. */
function readScrollState(): ScrollProgress {
  if (typeof window === 'undefined') {
    return { scrollY: 0, viewportH: 0, docH: 0, scrollPercent: 0 };
  }

  const scrollY = window.scrollY;
  const viewportH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const scrollPercent = docH > viewportH ? scrollY / (docH - viewportH) : 0;

  return {
    scrollY,
    viewportH,
    docH,
    scrollPercent: Math.max(0, Math.min(1, scrollPercent)),
  };
}

/** The page event that changes the document's length with no scrolling. */
const WATCHED = [DETAILS_OPENED_EVENT];

/**
 * Returns current scroll position, viewport height, document height,
 * and normalized scroll percentage (readScrollState).
 *
 * @returns {ScrollProgress} Current scroll state.
 */
export function useScrollProgress(): ScrollProgress {
  const [state, setState] = useState<ScrollProgress>(readScrollState);
  const prevRef = useRef<ScrollProgress>(state);

  /* Read on the frame every watcher shares, so this runs once a frame however
     many things moved, and reports only when one of the numbers it carries has
     actually changed. It once held a lock it released after every commit,
     which let a scroll long enough to span many of them chain one update onto
     the next until React called a halt. A frame cannot happen inside a commit,
     so the frame is the whole of the guard. */
  useViewportSignal(() => {
    const next = readScrollState();
    const p = prevRef.current;
    if (
      next.scrollY === p.scrollY &&
      next.viewportH === p.viewportH &&
      next.docH === p.docH &&
      next.scrollPercent === p.scrollPercent
    ) {
      return;
    }

    prevRef.current = next;
    setState(next);
  }, WATCHED);

  return state;
}
