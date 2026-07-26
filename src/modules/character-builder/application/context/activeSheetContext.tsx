/**
 * @fileoverview Active Sheet Context
 * @description Owns the *session* state of the character sheet: the working
 * draft lifecycle, the edit mode flag, and the active tab. It deliberately
 * holds no character data of its own — the entity lives in exactly one place,
 * {@link CharacterEntityProvider}, which this provider mounts around the sheet
 * with the display entity (draft while editing, saved snapshot otherwise).
 * `useSheetData` / `useSheetField` therefore read straight from that one
 * context, so there is no second copy of the character to drift out of sync.
 *
 * Exposes a typed mutator API and selector hooks so consumers never need to
 * receive `data` / `onChange` props.
 *
 * Writes are never gated on edit mode — see {@link sheetReducer}. Edit mode
 * decides only whether a write joins the cancellable draft transaction. Any
 * saved-character change (a live-play write, or a `COMMIT_SAVE`) is pushed to
 * the outer roster context (`@/lib/context/CharacterSheetContext`) by a single
 * effect, so there is exactly one route to the persistence layer.
 *
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
 * Mutator API exposed to consumers via `useSheetMutators`.
 *
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
 * Session state exposed by the context value. Character data is intentionally
 * absent — read it with {@link useSheetData}, which resolves to the single
 * entity context.
 *
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
 *
 * @interface ActiveSheetProviderProps
 * @property {CharacterSheetType} character - Saved character to seed state
 * @property {SheetTabId} [initialTab] - Initial active tab (default 'overview')
 * @property {string | null} [startEditingId] - When it matches `character.id`, the sheet enters edit mode on mount/selection (used to open freshly-created characters directly in edit mode)
 * @property {ReactNode} children - Subtree that reads from this context
 */
export interface ActiveSheetProviderProps {
  character: CharacterSheetType;
  initialTab?: SheetTabId;
  startEditingId?: string | null;
  children: ReactNode;
}

/**
 * Provides the active-sheet state and mutators to descendants.
 * Calling `saveEdit` dispatches `UPSERT_CHARACTER` to the outer roster context.
 *
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
   * Adopt a different character when the roster selects one. The reducer is
   * already seeded from this prop, so the mount pass is deliberately skipped:
   * child effects run before the provider's, and an unconditional mount-time
   * sync would discard any write a descendant made on its own mount (the
   * hit-dice reconciler, for one).
   */
  const syncedCharacterRef = useRef(character);
  useEffect(() => {
    if (syncedCharacterRef.current === character) return;
    syncedCharacterRef.current = character;
    dispatch({ type: 'SYNC_CHARACTER', payload: { character } });
  }, [character]);

  /**
   * Enter edit mode when the active character is one flagged to open editing
   * (a freshly-created character). Runs after SYNC has seeded the draft, and
   * only re-fires when the flagged id or active character changes — so
   * cancelling edit does not re-trigger it.
   */
  useEffect(() => {
    if (startEditingId && startEditingId === character.id) {
      dispatch({ type: 'BEGIN_EDIT' });
    }
  }, [startEditingId, character.id]);

  /**
   * The single path by which this sheet reaches the persistence layer. Any write
   * that lands on the saved character — a live-play edit outside edit mode, or a
   * `COMMIT_SAVE` — marks the reducer dirty, and this pushes it upstream.
   *
   * The trigger is the dirty flag rather than a comparison against the incoming
   * `character` prop. The roster rebuilds every upserted character (not least to
   * stamp `updatedAt`), so the push comes back as a brand-new object one commit
   * later; a prop comparison would still be looking at the pre-echo value in the
   * commit where the adopting `SYNC_CHARACTER` is already queued, push again,
   * and mint another object — forever.
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
 * Read the full active-sheet context. Throws if used outside the provider.
 *
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
 * Read the currently displayed character data (`draft` when editing, else the
 * saved snapshot). Resolves to the single {@link CharacterEntityProvider} the
 * sheet mounts, so this and `useCharacterEntity` always return the same object.
 *
 * @function useSheetData
 * @returns {CharacterSheetType} The display data
 */
export const useSheetData = (): CharacterSheetType => useCharacterEntity();

/**
 * Read the edit mode flag.
 *
 * @function useSheetEditing
 * @returns {boolean} `true` when in edit mode
 */
export const useSheetEditing = (): boolean => useActiveSheet().editing;

/**
 * Read the active tab + setter.
 *
 * @function useSheetTab
 * @returns {[SheetTabId, (tab: SheetTabId) => void]} Tuple of current tab and setter
 */
export const useSheetTab = (): [SheetTabId, (tab: SheetTabId) => void] => {
  const ctx = useActiveSheet();
  return [ctx.activeTab, ctx.mutators.setActiveTab];
};

/**
 * Read the mutator API.
 *
 * @function useSheetMutators
 * @returns {SheetMutators} The write API
 */
export const useSheetMutators = (): SheetMutators => useActiveSheet().mutators;

/**
 * Read a single top-level field from the active character data.
 *
 * @function useSheetField
 * @param {K} key - Key of the character field to read
 * @returns {CharacterSheetType[K]} The current value of that field
 * @template {keyof CharacterSheetType} K
 */
export const useSheetField = <K extends keyof CharacterSheetType>(
  key: K,
): CharacterSheetType[K] => useCharacterEntityField(key);
