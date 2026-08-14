/**
 * @fileoverview Viewport Media Query Hooks
 * @description SSR-safe `matchMedia` subscription hooks. Returns `undefined`
 * on the server and during pre-hydration client render.
 *
 * @module lib/hooks/useMediaQuery
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { useSyncExternalStore } from 'react';

/**
 * Matches viewport widths below the desktop breakpoint (max-width: 1023.98px).
 */
export const MOBILE_VIEWPORT_QUERY = '(max-width: 1023.98px)';

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 * Returns `undefined` on the server and during hydration.
 *
 * @function useMediaQuery
 * @param {string} query - CSS media query string, e.g. `(max-width: 768px)`
 * @returns {boolean | undefined} Match state, or `undefined` pre-hydration
 *
 * @example
 * const isNarrow = useMediaQuery('(max-width: 768px)');
 * if (isNarrow === undefined) return null;
 */
export function useMediaQuery(query: string): boolean | undefined {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    () =>
      typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : undefined,
    () => undefined,
  );
}

/**
 * Wrapper around {@link useMediaQuery} bound to {@link MOBILE_VIEWPORT_QUERY}.
 *
 * @function useIsMobileViewport
 * @returns {boolean | undefined} True on phone-sized viewports, `undefined` pre-hydration
 */
export function useIsMobileViewport(): boolean | undefined {
  return useMediaQuery(MOBILE_VIEWPORT_QUERY);
}
