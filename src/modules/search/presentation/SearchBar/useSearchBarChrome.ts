/**
 * @fileoverview Search bar chrome effects.
 * @description The global Cmd/Ctrl-K focus shortcut. Outside-click and
 * dropdown-room measurement live in `@/lib/hooks`.
 *
 * @module modules/search/presentation/SearchBar/useSearchBarChrome
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useEffect, type RefObject } from 'react';

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
