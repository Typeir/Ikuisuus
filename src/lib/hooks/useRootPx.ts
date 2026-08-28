/**
 * @fileoverview Root font size in px, kept current with the reader's text scale.
 * @description Virtualized rows are absolutely positioned and sized in px, so a
 * rem-based row pitch has to be resolved against the root font size at runtime.
 * The root is `calc(--text-scale-base * --text-scale-user)`; the user multiplier
 * is written to the root's `style` attribute, which is what the observer watches.
 *
 * @module lib/hooks/useRootPx
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Root font size assumed before the document can be measured (the shipped
 * 87.5% base against a 16 px browser default).
 *
 * @constant
 * @type {number}
 */
export const FALLBACK_ROOT_PX = 14;

/**
 * Reads the root element's computed font size in px.
 *
 * @returns {number} Root font size, or the fallback when unavailable
 */
export function measureRootPx(): number {
  if (typeof document === 'undefined') return FALLBACK_ROOT_PX;
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(px) && px > 0 ? px : FALLBACK_ROOT_PX;
}

/**
 * Root font size in px. Re-measures a frame after mount and whenever the
 * root's `style` attribute changes, which is where the text-scale
 * preference lands.
 *
 * @returns {number} Root font size in px
 */
export function useRootPx(): number {
  const [rootPx, setRootPx] = useState(measureRootPx);

  useEffect(() => {
    const update = () => setRootPx(measureRootPx());
    const frame = requestAnimationFrame(update);
    const observer =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(update);
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return rootPx;
}
