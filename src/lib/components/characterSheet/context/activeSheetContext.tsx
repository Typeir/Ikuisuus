/**
 * @fileoverview Active Sheet Context
 * @description Single source of truth for the character currently being viewed
 * or edited in the character sheet UI. Owns the working draft, edit mode flag,
 * and active tab. Exposes a typed mutator API and selector hooks so consumers
 * never need to receive `data` / `onChange` props.
 *
 * On `saveEdit`, dispatches `UPSERT_CHARACTER` to the outer roster context
 * (`@/lib/context/CharacterSheetContext`) — that is the persistence layer.
 *
 * @module lib/components/characterSheet/context/activeSheetContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCharacterSheetDispatch } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { computeProficiencyBonus } from '@/lib/utils/characterStorage';
import {
  getLevelFromXP,
  getXPForLevel,
  MAX_XP_LEVEL,
} from '@/lib/utils/xpProgression';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    type ReactNode,
} from 'react';

/** Available tab identifiers inside the character sheet. */
export type SheetTabId =
  | 'overview'
  | 'bloodline'
  | 'vocation'
  | 'equipment'
  | 'feats';

/**
 * Internal reducer state.
 *
 * @interface SheetReducerState
 * @property {CharacterSheetType} character - Last saved character snapshot
 * @property {CharacterSheetType} draft - Working copy used while editing
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {SheetTabId} activeTab - Currently displayed tab
 */
interface SheetReducerState {
  character: CharacterSheetType;
  draft: CharacterSheetType;
  editing: boolean;
  activeTab: SheetTabId;
}

type SheetAction =
  | { type: 'PATCH'; payload: Partial<CharacterSheetType> }
  | {
      type: 'PATCH_ABILITY';
      payload: {
        key: keyof CharacterSheetType['abilityScores'];
        score: number;
      };
    }
  | {
      type: 'PATCH_VOCATIONS';
      payload: { vocations: CharacterSheetType['vocations'] };
    }
  | { type: 'BEGIN_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'COMMIT_SAVE' }
  | { type: 'SYNC_CHARACTER'; payload: { character: CharacterSheetType } }
  | { type: 'SET_TAB'; payload: { tab: SheetTabId } };

/**
 * Reducer for the active-sheet state machine.
 *
 * @function sheetReducer
 * @param {SheetReducerState} state - Previous state
 * @param {SheetAction} action - Dispatched action
 * @returns {SheetReducerState} Next state
 */
const sheetReducer = (
  state: SheetReducerState,
  action: SheetAction,
): SheetReducerState => {
  switch (action.type) {
    case 'PATCH': {
      return { ...state, draft: { ...state.draft, ...action.payload } };
    }
    case 'PATCH_ABILITY': {
      const { key, score } = action.payload;
      return {
        ...state,
        draft: {
          ...state.draft,
          abilityScores: { ...state.draft.abilityScores, [key]: score },
        },
      };
    }
    case 'PATCH_VOCATIONS': {
      const vocations = action.payload.vocations;
      const vocationSum = vocations
        .filter((v) => Boolean(v.slug))
        .reduce((sum, v) => sum + (v.level ?? 0), 0);
      const xpLevel = getLevelFromXP(state.draft.experience ?? 0);
      if (vocationSum > xpLevel) {
        const newLevel = Math.min(vocationSum, MAX_XP_LEVEL);
        return {
          ...state,
          draft: {
            ...state.draft,
            vocations,
            level: newLevel,
            experience: getXPForLevel(newLevel),
            proficiencyBonus: computeProficiencyBonus(newLevel),
          },
        };
      }
      return { ...state, draft: { ...state.draft, vocations } };
    }
    case 'BEGIN_EDIT':
      return { ...state, editing: true, draft: state.character };
    case 'CANCEL_EDIT':
      return { ...state, editing: false, draft: state.character };
    case 'COMMIT_SAVE':
      return { ...state, editing: false, character: state.draft };
    case 'SYNC_CHARACTER': {
      if (state.editing) return state;
      const c = action.payload.character;
      return { ...state, character: c, draft: c };
    }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload.tab };
    default:
      return state;
  }
};

/**
 * Mutator API exposed to consumers via `useSheetMutators`.
 *
 * @interface SheetMutators
 * @property {(partial: Partial<CharacterSheetType>) => void} patch - Merge a partial patch into the draft
 * @property {(key: keyof CharacterSheetType['abilityScores'], score: number) => void} patchAbility - Update a single ability score
 * @property {(next: CharacterSheetType['vocations']) => void} patchVocations - Replace the vocations array (auto-recomputes level/XP/PB)
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
  beginEdit: () => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setActiveTab: (tab: SheetTabId) => void;
}

/**
 * Read-only view exposed by the context value.
 *
 * @interface SheetContextValue
 * @property {CharacterSheetType} character - Last saved snapshot
 * @property {CharacterSheetType} draft - Editable working copy
 * @property {CharacterSheetType} data - `draft` when editing, else `character`
 * @property {boolean} editing - Edit mode flag
 * @property {SheetTabId} activeTab - Currently displayed tab
 * @property {SheetMutators} mutators - Write API
 */
export interface SheetContextValue {
  character: CharacterSheetType;
  draft: CharacterSheetType;
  data: CharacterSheetType;
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
 * @property {ReactNode} children - Subtree that reads from this context
 */
export interface ActiveSheetProviderProps {
  character: CharacterSheetType;
  initialTab?: SheetTabId;
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
  children,
}) => {
  const dispatchRoster = useCharacterSheetDispatch();
  const [state, dispatch] = useReducer(sheetReducer, {
    character,
    draft: character,
    editing: false,
    activeTab: initialTab,
  });

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
    dispatchRoster({
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: state.draft },
    });
    dispatch({ type: 'COMMIT_SAVE' });
  }, [dispatchRoster, state.draft]);

  const mutators = useMemo<SheetMutators>(
    () => ({
      patch,
      patchAbility,
      patchVocations,
      beginEdit,
      saveEdit,
      cancelEdit,
      setActiveTab,
    }),
    [
      patch,
      patchAbility,
      patchVocations,
      beginEdit,
      saveEdit,
      cancelEdit,
      setActiveTab,
    ],
  );

  const value = useMemo<SheetContextValue>(() => {
    const data = state.editing ? state.draft : state.character;
    return {
      character: state.character,
      draft: state.draft,
      data,
      editing: state.editing,
      activeTab: state.activeTab,
      mutators,
    };
  }, [state, mutators]);

  return (
    <ActiveSheetContext.Provider value={value}>
      {children}
    </ActiveSheetContext.Provider>
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
 * Read the currently displayed character data (`draft` when editing, else `character`).
 *
 * @function useSheetData
 * @returns {CharacterSheetType} The display data
 */
export const useSheetData = (): CharacterSheetType => useActiveSheet().data;

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
): CharacterSheetType[K] => useActiveSheet().data[key];
