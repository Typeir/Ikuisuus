/**
 * @fileoverview Aspect autocomplete wiring shared by every search input.
 * @description Owns the caret, the suggestion list and the keyboard nav so
 * any input can turn a typed `group:value` token into an aspect.
 *
 * @module modules/search/presentation/SearchBar/useAspectAutocomplete
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useCallback, useState } from 'react';
import { useAspectSuggestions } from './useAspectSuggestions';

/**
 * An aspect resolved out of the input text.
 *
 * @property {string} aspect - The chosen `group:value` token
 * @property {string} rest - The query with that token removed
 */
export interface PickedAspect {
  aspect: string;
  rest: string;
}

/**
 * Autocomplete state and handlers for one input.
 *
 * @property {string[]} suggestions - Matching `group:value` tokens
 * @property {number} activeIndex - Keyboard-highlighted suggestion, -1 for none
 * @property {boolean} suggesting - Whether any suggestion is on offer
 * @property {(index: number) => void} pickAt - Applies the suggestion at an index
 * @property {(event: React.SyntheticEvent<HTMLInputElement>) => void} trackCaret - Caret tracker for select, click and keyup
 * @property {(event: React.ChangeEvent<HTMLInputElement>) => void} handleChange - Caret tracker for typing
 * @property {(event: React.KeyboardEvent) => boolean} handleKeyDown - Returns true when the key was consumed
 */
export interface AspectAutocompleteResult {
  suggestions: string[];
  activeIndex: number;
  suggesting: boolean;
  pickAt: (index: number) => void;
  trackCaret: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: React.KeyboardEvent) => boolean;
}

/**
 * Aspect autocomplete for a text input.
 *
 * @param {string} query - Full input text
 * @param {(picked: PickedAspect) => void} onPick - Receives the chosen aspect and the remaining query
 * @returns {AspectAutocompleteResult} Suggestions, highlight state and input handlers
 *
 * @example
 * const aspects = useAspectAutocomplete(term, ({ aspect, rest }) => {
 *   setFilters((prev) => [...prev, aspect]);
 *   setTerm(rest);
 * });
 */
export function useAspectAutocomplete(
  query: string,
  onPick: (picked: PickedAspect) => void,
): AspectAutocompleteResult {
  const [caret, setCaret] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, pick } = useAspectSuggestions(query, caret);
  const suggesting = suggestions.length > 0;

  const trackCaret = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      setCaret(
        event.currentTarget.selectionStart ?? event.currentTarget.value.length,
      );
    },
    [],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCaret(event.target.selectionStart ?? event.target.value.length);
      setActiveIndex(-1);
    },
    [],
  );

  const pickAt = useCallback(
    (index: number) => {
      const picked = pick(index);
      if (!picked) return;
      setActiveIndex(-1);
      onPick(picked);
    },
    [pick, onPick],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): boolean => {
      if (!suggesting) return false;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0,
          );
          return true;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1,
          );
          return true;
        case 'Enter':
          event.preventDefault();
          pickAt(activeIndex >= 0 ? activeIndex : 0);
          return true;
        case 'Tab':
          if (activeIndex < 0) return false;
          event.preventDefault();
          pickAt(activeIndex);
          return true;
        case 'Escape':
          setActiveIndex(-1);
          return false;
      }
      return false;
    },
    [suggesting, suggestions.length, activeIndex, pickAt],
  );

  return {
    suggestions,
    activeIndex,
    suggesting,
    pickAt,
    trackCaret,
    handleChange,
    handleKeyDown,
  };
}
