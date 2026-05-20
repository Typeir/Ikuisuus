/**
 * @fileoverview Character Sheet Edit Context
 * @description Lightweight React context that exposes the *active* character
 * draft, the current `editing` flag, the `onChange` patch callback, and the
 * resolved `locale` to any descendant of {@link CharacterSheet} without
 * prop drilling. Components inside the sheet (header, meta row, tabs, combat
 * stats row, etc.) should read this context directly instead of accepting
 * `data` / `editing` / `onChange` / `locale` as props.
 *
 * The context is intentionally local to a single rendered character sheet —
 * it is *not* the global characters store (that lives in
 * {@link CharacterSheetContext}).
 *
 * @module lib/context/CharacterSheetEditContext
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { CharacterSheet as CharacterSheetType } from '../types/character';

/**
 * Value exposed by {@link CharacterSheetEditContext}.
 *
 * @interface CharacterSheetEditContextValue
 * @property {CharacterSheetType} data - The character data currently being rendered (draft when editing, saved otherwise)
 * @property {boolean} editing - True when the sheet is in edit mode
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Callback to patch the active draft
 * @property {string} locale - Active content locale (e.g. `en`, `es`)
 */
export interface CharacterSheetEditContextValue {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale: string;
}

const CharacterSheetEditContext =
  createContext<CharacterSheetEditContextValue | null>(null);

/**
 * Props for {@link CharacterSheetEditProvider}.
 *
 * @interface CharacterSheetEditProviderProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch callback
 * @property {string} locale - Active content locale
 * @property {ReactNode} children - Subtree that should consume the context
 */
export interface CharacterSheetEditProviderProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale: string;
  children: ReactNode;
}

/**
 * Provides the active draft, editing flag, change callback, and locale to the
 * character-sheet subtree.
 *
 * @component
 * @param {CharacterSheetEditProviderProps} props - Provider props
 * @returns {JSX.Element} Context provider
 */
export function CharacterSheetEditProvider({
  data,
  editing,
  onChange,
  locale,
  children,
}: CharacterSheetEditProviderProps): JSX.Element {
  const value = useMemo<CharacterSheetEditContextValue>(
    () => ({ data, editing, onChange, locale }),
    [data, editing, onChange, locale],
  );
  return (
    <CharacterSheetEditContext.Provider value={value}>
      {children}
    </CharacterSheetEditContext.Provider>
  );
}

/**
 * Reads the {@link CharacterSheetEditContext} value. Throws if used outside a
 * provider so consumers don't silently render against `undefined` data.
 *
 * @function useCharacterSheetEdit
 * @returns {CharacterSheetEditContextValue} Active sheet edit context
 * @throws {Error} When used outside a {@link CharacterSheetEditProvider}
 */
export function useCharacterSheetEdit(): CharacterSheetEditContextValue {
  const ctx = useContext(CharacterSheetEditContext);
  if (!ctx) {
    throw new Error(
      'useCharacterSheetEdit must be used within a CharacterSheetEditProvider',
    );
  }
  return ctx;
}
