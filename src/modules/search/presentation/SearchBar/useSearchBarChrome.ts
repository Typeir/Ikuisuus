/**
 * @fileoverview Search bar chrome effects.
 * @description The three DOM-level behaviours of the bar that are not about
 * searching: the global Cmd/Ctrl-K focus shortcut, closing on outside click,
 * and measuring how much room the dropdown has under the input.
 *
 * @module modules/search/presentation/SearchBar/useSearchBarChrome
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * Focuses the input on Cmd/Ctrl-K when it is visible.
 *
 * @param {RefObject<HTMLInputElement | null>} inputRef - The search input
 */
export function useFocusShortcut(inputRef: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const input = inputRef.current;
        if (!input) return;
        if (typeof input.checkVisibility === 'function' && !input.checkVisibility()) {
          return;
        }
        e.preventDefault();
        input.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [inputRef]);
}

/**
 * Calls `onOutside` on a mousedown outside both the wrapper and the input.
 *
 * @param {RefObject<HTMLElement | null>} wrapRef - Bar wrapper
 * @param {RefObject<HTMLElement | null>} inputRef - The search input
 * @param {() => void} onOutside - Close handler
 */
export function useOutsideClick(
  wrapRef: RefObject<HTMLElement | null>,
  inputRef: RefObject<HTMLElement | null>,
  onOutside: () => void,
): void {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        onOutside();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [wrapRef, inputRef, onOutside]);
}

/**
 * Dropdown max height: at least 160px, capped to the space under the wrapper.
 *
 * @param {RefObject<HTMLElement | null>} wrapRef - Bar wrapper
 * @param {boolean} active - Measure only while the dropdown shows
 * @returns {number | null} Pixel cap, or null before the first measure
 */
export function useDropdownRoom(
  wrapRef: RefObject<HTMLElement | null>,
  active: boolean,
): number | null {
  const [max, setMax] = useState<number | null>(null);
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setMax(Math.max(160, window.innerHeight - rect.bottom - 16));
  }, [wrapRef]);

  useEffect(() => {
    if (!active) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, measure]);

  return max;
}
