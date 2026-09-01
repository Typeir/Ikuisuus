/**
 * Character Sheet Context and Provider
 *
 * @fileoverview React context for character sheet state. Splits state and
 * dispatch contexts, persists via storePersistentDataRef.
 *
 * @module lib/context/CharacterSheetContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { JSX } from 'react';
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { characterSheetReducer } from '../reducers/characterSheetReducer';
import type { CharacterSheet } from '../types/character';
import {
    CHARACTER_SHEET_ACTION_TYPES,
    CHARACTER_SHEET_STORAGE_KEY,
    DEFAULT_CHARACTER_SHEET_STATE,
    type CharacterSheetAction,
    type CharacterSheetState,
} from '../types/characterSheet';
import { ensureStorageSchema } from '../utils/storageSchema';
import {
    fetchPersistentDataRef,
    storePersistentDataRef,
} from '../utils/storePersistentData';

/**
 * Serialized form stored in the persistence layer.
 *
 * @interface SerializedCharacterSheetState
 * @property {CharacterSheet[]} characters - Saved character sheets
 * @property {string | null} activeId - Currently active character ID
 */
interface SerializedCharacterSheetState {
  characters: CharacterSheet[];
  activeId: string | null;
}

/**
 * Reads and parses the persisted character sheet state from storage.
 * Returns an empty state on missing or unparseable data.
 *
 * @function readPersistedCharacters
 * @returns {SerializedCharacterSheetState} Parsed state or safe empty fallback
 */
function readPersistedCharacters(): SerializedCharacterSheetState {
  ensureStorageSchema();
  const raw = fetchPersistentDataRef(CHARACTER_SHEET_STORAGE_KEY);
  if (!raw) return { characters: [], activeId: null };
  try {
    const parsed = JSON.parse(raw) as Partial<SerializedCharacterSheetState>;
    return {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
    };
  } catch {
    return { characters: [], activeId: null };
  }
}

/**
 * Writes the current character sheet state to the fallback storage layers
 * (sessionStorage and localStorage).
 *
 * @function writePersistedCharacters
 * @param {CharacterSheetState} state - Current state to persist
 * @returns {void}
 */
function writePersistedCharacters(state: CharacterSheetState): void {
  if (typeof window === 'undefined') return;
  const serialized: SerializedCharacterSheetState = {
    characters: state.characters,
    activeId: state.activeId,
  };
  storePersistentDataRef(
    CHARACTER_SHEET_STORAGE_KEY,
    JSON.stringify(serialized),
  );
}

/**
 * State context value shape
 *
 * @interface CharacterSheetStateContextValue
 * @property {CharacterSheetState} state - Current character sheet state
 */
interface CharacterSheetStateContextValue {
  state: CharacterSheetState;
}

/**
 * Dispatch context value shape
 *
 * @interface CharacterSheetDispatchContextValue
 * @property {(action: CharacterSheetAction) => void} dispatch - Action dispatcher
 */
interface CharacterSheetDispatchContextValue {
  dispatch: (action: CharacterSheetAction) => void;
}

const CharacterSheetStateContext =
  createContext<CharacterSheetStateContextValue | null>(null);
const CharacterSheetDispatchContext =
  createContext<CharacterSheetDispatchContextValue | null>(null);

/**
 * Props for CharacterSheetProvider.
 *
 * @interface CharacterSheetProviderProps
 * @property {ReactNode} children - Child components to render
 */
interface CharacterSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider component for character sheet state.
 *
 * @component
 * @param {CharacterSheetProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Context providers wrapping children
 *
 * @description
 * Hydrates the reducer from persisted storage on first render; writes back
 * (debounced 250 ms) on every state change.
 */
export function CharacterSheetProvider({
  children,
}: CharacterSheetProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(
    characterSheetReducer,
    DEFAULT_CHARACTER_SHEET_STATE,
  );

  useEffect(() => {
    const persisted = readPersistedCharacters();
    dispatch({
      type: CHARACTER_SHEET_ACTION_TYPES.HYDRATE,
      payload: {
        characters: persisted.characters,
        activeId: persisted.activeId,
      },
    });
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    const handle = setTimeout(() => {
      writePersistedCharacters(state);
    }, 250);
    return () => clearTimeout(handle);
  }, [state]);

  const stateValue = useMemo<CharacterSheetStateContextValue>(
    () => ({ state }),
    [state],
  );
  const dispatchValue = useMemo<CharacterSheetDispatchContextValue>(
    () => ({ dispatch }),
    [],
  );

  return (
    <CharacterSheetStateContext.Provider value={stateValue}>
      <CharacterSheetDispatchContext.Provider value={dispatchValue}>
        {children}
      </CharacterSheetDispatchContext.Provider>
    </CharacterSheetStateContext.Provider>
  );
}

/**
 * Hook to access the full character sheet state.
 *
 * @function useCharacterSheetState
 * @returns {CharacterSheetState} Current character sheet state
 * @throws {Error} When used outside CharacterSheetProvider
 */
export function useCharacterSheetState(): CharacterSheetState {
  const context = useContext(CharacterSheetStateContext);
  if (!context) {
    throw new Error(
      'useCharacterSheetState must be used within a CharacterSheetProvider',
    );
  }
  return context.state;
}

/**
 * Hook to access the character sheet dispatch function.
 *
 * @function useCharacterSheetDispatch
 * @returns {(action: CharacterSheetAction) => void} Dispatch function
 * @throws {Error} When used outside CharacterSheetProvider
 */
export function useCharacterSheetDispatch(): (
  action: CharacterSheetAction,
) => void {
  const context = useContext(CharacterSheetDispatchContext);
  if (!context) {
    throw new Error(
      'useCharacterSheetDispatch must be used within a CharacterSheetProvider',
    );
  }
  return context.dispatch;
}

/**
 * Returns the active CharacterSheet, or null if none is selected.
 * Result is memoized per provider render.
 *
 * @function useActiveCharacter
 * @returns {CharacterSheet | null} The active character or null
 */
export function useActiveCharacter(): CharacterSheet | null {
  const { characters, activeId } = useCharacterSheetState();
  return useMemo(
    () => characters.find((c) => c.id === activeId) ?? null,
    [characters, activeId],
  );
}

/**
 * Returns all saved characters.
 *
 * @function useCharacters
 * @returns {CharacterSheet[]} All saved character sheets
 */
export function useCharacters(): CharacterSheet[] {
  return useCharacterSheetState().characters;
}
