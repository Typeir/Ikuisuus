/**
 * @fileoverview Viewport Media Query Hooks
 * @description SSR-safe `matchMedia` subscription hooks. During server render
 * and the first client render (pre-hydration) the result is `undefined` so
 * consumers can defer viewport-dependent tree changes until the real value is
 * known, avoiding hydration mismatches.
 *
 * @module lib/hooks/useMediaQuery
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { useSyncExternalStore } from 'react';

/**
 * Breakpoint below which the app renders phone-oriented layouts. Strictly
 * below the SCSS `$bp-desktop` token (1024px) — the exact width at which
 * the shell's Tailwind `lg:` sidebar appears — so the two layouts never
 * desync into a mixed state.
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
 * Whether the viewport is below the desktop breakpoint (≤1024px).
 * Convenience wrapper around {@link useMediaQuery} bound to
 * {@link MOBILE_VIEWPORT_QUERY}.
 *
 * @function useIsMobileViewport
 * @returns {boolean | undefined} True on phone-sized viewports, `undefined` pre-hydration
 */
export function useIsMobileViewport(): boolean | undefined {
  return useMediaQuery(MOBILE_VIEWPORT_QUERY);
}
