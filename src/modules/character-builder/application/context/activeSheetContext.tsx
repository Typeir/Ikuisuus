/**
 * @fileoverview Active Sheet Context
 * @description Owns the sheet session state: draft lifecycle, edit-mode flag,
 * and active tab. Holds no character data; the sheet mounts a single
 * {@link CharacterEntityProvider} with the display entity (draft while
 * editing, saved snapshot otherwise). Exposes a typed mutator API and selector
 * hooks. Writes are not gated on edit mode — see {@link sheetReducer}. Any
 * saved-character change is pushed to the outer roster context
 * (`@/lib/context/CharacterSheetContext`) by a single effect.
 * @module lib/components/characterSheet/context/activeSheetContext
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCharacterSheetDispatch } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    type ReactNode,
} from 'react';
import {
    CharacterEntityProvider,
    useCharacterEntity,
    useCharacterEntityField,
} from './characterEntityContext';
import { sheetReducer, type SheetTabId } from './sheetReducer';

export type { SheetTabId };

/**
 * Mutator API exposed via `useSheetMutators`.
 * @interface SheetMutators
 * @property {(partial: Partial<CharacterSheetType>) => void} patch - Merge a partial patch into the draft
 * @property {(key: keyof CharacterSheetType['abilityScores'], score: number) => void} patchAbility - Update a single ability score
 * @property {(next: CharacterSheetType['vocations']) => void} patchVocations - Replace the vocations array (auto-recomputes level/XP/PB)
 * @property {(xp: number) => void} patchExperience - Set XP (clamped to the vocation-sum floor); recomputes level/PB
 * @property {() => void} beginEdit - Enter edit mode, snapshot draft from character
 * @property {() => void} saveEdit - Persist draft to the roster context and exit edit mode
 * @property {() => void} cancelEdit - Discard draft and exit edit mode
 * @property {(tab: SheetTabId) => void} setActiveTab - Change the active tab
 */
export interface SheetMutators {
  patch: (partial: Partial<CharacterSheetType>) => void;
  patchAbility: (
    key: keyof CharacterSheetType['abilityScores'],
    score: number,
  ) => void;
  patchVocations: (next: CharacterSheetType['vocations']) => void;
  patchExperience: (xp: number) => void;
  beginEdit: () => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setActiveTab: (tab: SheetTabId) => void;
}

/**
 * Session state exposed by the context value. Character data lives in the
 * entity context — read it with {@link useSheetData}.
 * @interface SheetContextValue
 * @property {boolean} editing - Edit mode flag
 * @property {SheetTabId} activeTab - Currently displayed tab
 * @property {SheetMutators} mutators - Write API
 */
export interface SheetContextValue {
  editing: boolean;
  activeTab: SheetTabId;
  mutators: SheetMutators;
}

const ActiveSheetContext = createContext<SheetContextValue | null>(null);

/**
 * Props for the ActiveSheetProvider.
 * @interface ActiveSheetProviderProps
 * @property {CharacterSheetType} character - Saved character to seed state
 * @property {SheetTabId} [initialTab] - Initial active tab (default 'overview')
 * @property {string | null} [startEditingId] - If it matches `character.id`, the sheet enters edit mode on mount/selection
 * @property {ReactNode} children - Subtree that reads from this context
 */
export interface ActiveSheetProviderProps {
  character: CharacterSheetType;
  initialTab?: SheetTabId;
  startEditingId?: string | null;
  children: ReactNode;
}

/**
 * Provides the active-sheet state and mutators to descendants. `saveEdit`
 * dispatches `UPSERT_CHARACTER` to the outer roster context.
 * @component
 * @param {ActiveSheetProviderProps} props - Provider props
 * @returns {JSX.Element} Context provider element
 */
export const ActiveSheetProvider: React.FC<ActiveSheetProviderProps> = ({
  character,
  initialTab = 'overview',
  startEditingId,
  children,
}) => {
  const dispatchRoster = useCharacterSheetDispatch();
  const [state, dispatch] = useReducer(sheetReducer, {
    character,
    draft: character,
    editing: false,
    activeTab: initialTab,
    dirty: false,
  });

  /**
   * Adopts a different character when the roster selects one. Skips the initial
   * mount pass; the reducer is already seeded from the `character` prop.
   */
  const syncedCharacterRef = useRef(character);
  useEffect(() => {
    if (syncedCharacterRef.current === character) return;
    syncedCharacterRef.current = character;
    dispatch({ type: 'SYNC_CHARACTER', payload: { character } });
  }, [character]);

  /**
   * Enters edit mode when `startEditingId` matches `character.id`. Re-fires
   * only when the flagged id or active character changes.
   */
  useEffect(() => {
    if (startEditingId && startEditingId === character.id) {
      dispatch({ type: 'BEGIN_EDIT' });
    }
  }, [startEditingId, character.id]);

  /**
   * Pushes dirty saved-character writes to the outer roster context via
   * `UPSERT_CHARACTER`. Skips while editing. Triggered by the dirty flag, not
   * by comparison against the incoming `character` prop.
   */
  useEffect(() => {
    if (state.editing || !state.dirty) return;
    dispatchRoster({
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: state.character },
    });
  }, [state.editing, state.dirty, state.character, dispatchRoster]);

  const patch = useCallback((partial: Partial<CharacterSheetType>) => {
    dispatch({ type: 'PATCH', payload: partial });
  }, []);

  const patchAbility = useCallback(
    (key: keyof CharacterSheetType['abilityScores'], score: number) => {
      dispatch({ type: 'PATCH_ABILITY', payload: { key, score } });
    },
    [],
  );

  const patchVocations = useCallback(
    (vocations: CharacterSheetType['vocations']) => {
      dispatch({ type: 'PATCH_VOCATIONS', payload: { vocations } });
    },
    [],
  );

  const patchExperience = useCallback((xp: number) => {
    dispatch({ type: 'PATCH_EXPERIENCE', payload: { experience: xp } });
  }, []);

  const beginEdit = useCallback(() => {
    dispatch({ type: 'BEGIN_EDIT' });
  }, []);

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT' });
  }, []);

  const setActiveTab = useCallback((tab: SheetTabId) => {
    dispatch({ type: 'SET_TAB', payload: { tab } });
  }, []);

  const saveEdit = useCallback(() => {
    dispatch({ type: 'COMMIT_SAVE' });
  }, []);

  const mutators = useMemo<SheetMutators>(
    () => ({
      patch,
      patchAbility,
      patchVocations,
      patchExperience,
      beginEdit,
      saveEdit,
      cancelEdit,
      setActiveTab,
    }),
    [
      patch,
      patchAbility,
      patchVocations,
      patchExperience,
      beginEdit,
      saveEdit,
      cancelEdit,
      setActiveTab,
    ],
  );

  const value = useMemo<SheetContextValue>(
    () => ({
      editing: state.editing,
      activeTab: state.activeTab,
      mutators,
    }),
    [state.editing, state.activeTab, mutators],
  );

  const entity = state.editing ? state.draft : state.character;

  return (
    <CharacterEntityProvider entity={entity} patchEntity={patch}>
      <ActiveSheetContext.Provider value={value}>
        {children}
      </ActiveSheetContext.Provider>
    </CharacterEntityProvider>
  );
};

/**
 * Reads the full active-sheet context. Throws outside the provider.
 * @function useActiveSheet
 * @returns {SheetContextValue} The current context value
 * @throws {Error} When called outside an ActiveSheetProvider
 */
export const useActiveSheet = (): SheetContextValue => {
  const ctx = useContext(ActiveSheetContext);
  if (!ctx) {
    throw new Error(
      'useActiveSheet must be used inside an ActiveSheetProvider',
    );
  }
  return ctx;
};

/**
 * Reads the currently displayed character data (`draft` when editing, else the
 * saved snapshot). Resolves to {@link useCharacterEntity}; both return the
 * same object.
 * @function useSheetData
 * @returns {CharacterSheetType} The display data
 */
export const useSheetData = (): CharacterSheetType => useCharacterEntity();

/**
 * Reads the edit mode flag.
 * @function useSheetEditing
 * @returns {boolean} `true` when in edit mode
 */
export const useSheetEditing = (): boolean => useActiveSheet().editing;

/**
 * Reads the active tab and its setter.
 * @function useSheetTab
 * @returns {[SheetTabId, (tab: SheetTabId) => void]} Tuple of current tab and setter
 */
export const useSheetTab = (): [SheetTabId, (tab: SheetTabId) => void] => {
  const ctx = useActiveSheet();
  return [ctx.activeTab, ctx.mutators.setActiveTab];
};

/**
 * Reads the mutator API.
 * @function useSheetMutators
 * @returns {SheetMutators} The write API
 */
export const useSheetMutators = (): SheetMutators => useActiveSheet().mutators;

/**
 * Reads a single top-level field from the active character data.
 * @function useSheetField
 * @param {K} key - Key of the character field to read
 * @returns {CharacterSheetType[K]} The current value of that field
 * @template {keyof CharacterSheetType} K
 */
export const useSheetField = <K extends keyof CharacterSheetType>(
  key: K,
): CharacterSheetType[K] => useCharacterEntityField(key);
