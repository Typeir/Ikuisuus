/**
 * @fileoverview Active Sheet Reducer
 * @description Pure reducer for the active character sheet. `level` and
 * `tierBonus` are derived caches recomputed from `experience` and
 * `vocations`; XP writes are clamped to the vocation-sum floor, and PATCH
 * strips direct writes to `level`/`tierBonus`. While editing, writes land on
 * the draft only; otherwise on the saved character with `dirty` set.
 *
 * @module modules/character-builder/application/context/sheetReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import {
    getCharacterTierBonus,
    getTotalCharacterLevel,
    sumVocationLevels,
} from '@/modules/character-builder/lib/utils/characterDerivation';
import {
    getLevelFromXP,
    getXPForLevel,
    MAX_XP_LEVEL,
} from '@/modules/character-builder/lib/utils/xpProgression';

/** Available tab identifiers inside the character sheet. */
export type SheetTabId =
  | 'overview'
  | 'bloodline'
  | 'vocation'
  | 'equipment'
  | 'feats'
  | 'bibliography'
  | 'abilities';

/**
 * Internal reducer state.
 *
 * @interface SheetReducerState
 * @property {CharacterSheetType} character - Last saved character snapshot
 * @property {CharacterSheetType} draft - Working copy used while editing
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {SheetTabId} activeTab - Currently displayed tab
 * @property {boolean} dirty - Whether `character` holds changes the roster has not been told about yet. Set by any write landing on the saved character, cleared when a character is adopted from the roster.
 */
export interface SheetReducerState {
  character: CharacterSheetType;
  draft: CharacterSheetType;
  editing: boolean;
  activeTab: SheetTabId;
  dirty: boolean;
}

/** Discriminated union of reducer actions. */
export type SheetAction =
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
  | { type: 'PATCH_EXPERIENCE'; payload: { experience: number } }
  | { type: 'BEGIN_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'COMMIT_SAVE' }
  | { type: 'SYNC_CHARACTER'; payload: { character: CharacterSheetType } }
  | { type: 'SET_TAB'; payload: { tab: SheetTabId } };

/**
 * Returns the minimum XP required to satisfy the vocation-sum floor. Returns
 * 0 when no vocations are allocated.
 *
 * @function vocationXpFloor
 * @param {CharacterSheetType['vocations']} vocations - Vocation entries
 * @returns {number} XP floor (0 when no slugs)
 */
const vocationXpFloor = (
  vocations: CharacterSheetType['vocations'],
): number => {
  const sum = sumVocationLevels(vocations);
  return sum > 0 ? getXPForLevel(Math.min(MAX_XP_LEVEL, sum)) : 0;
};

/**
 * Applies a computed draft to the state: writes to the draft alone while
 * editing, otherwise to the saved character with `dirty` set.
 *
 * @function applyWrite
 * @param {SheetReducerState} state - Previous state
 * @param {CharacterSheetType} next - The computed next character
 * @returns {SheetReducerState} Next state
 */
const applyWrite = (
  state: SheetReducerState,
  next: CharacterSheetType,
): SheetReducerState =>
  state.editing
    ? { ...state, draft: next }
    : { ...state, draft: next, character: next, dirty: true };

/**
 * Recomputes `level` and `tierBonus` from the draft's `experience` and
 * `vocations` via the module's derivation functions.
 *
 * @function withRecomputedLevelCache
 * @param {CharacterSheetType} draft - Draft to normalize
 * @returns {CharacterSheetType} Draft with `level` and `tierBonus` synced
 */
const withRecomputedLevelCache = (
  draft: CharacterSheetType,
): CharacterSheetType => ({
  ...draft,
  level: getTotalCharacterLevel(draft),
  tierBonus: getCharacterTierBonus(draft),
});

/**
 * Reducer for the active-sheet state machine.
 *
 * @function sheetReducer
 * @param {SheetReducerState} state - Previous state
 * @param {SheetAction} action - Dispatched action
 * @returns {SheetReducerState} Next state
 */
export const sheetReducer = (
  state: SheetReducerState,
  action: SheetAction,
): SheetReducerState => {
  switch (action.type) {
    case 'PATCH': {
      const {
        level: _l,
        tierBonus: _pb,
        experience,
        vocations,
        ...rest
      } = action.payload;
      void _l;
      void _pb;
      let next: CharacterSheetType = { ...state.draft, ...rest };
      if (vocations !== undefined) {
        next = { ...next, vocations };
      }
      if (experience !== undefined) {
        next = {
          ...next,
          experience: Math.max(vocationXpFloor(next.vocations), experience),
        };
      } else if (vocations !== undefined) {
        const vocationSum = sumVocationLevels(next.vocations);
        if (vocationSum > getLevelFromXP(next.experience ?? 0)) {
          next = {
            ...next,
            experience: getXPForLevel(Math.min(MAX_XP_LEVEL, vocationSum)),
          };
        }
      }
      return applyWrite(state, withRecomputedLevelCache(next));
    }
    case 'PATCH_ABILITY': {
      const { key, score } = action.payload;
      return applyWrite(state, {
        ...state.draft,
        abilityScores: { ...state.draft.abilityScores, [key]: score },
      });
    }
    case 'PATCH_VOCATIONS': {
      const vocations = action.payload.vocations;
      const vocationSum = sumVocationLevels(vocations);
      let nextDraft: CharacterSheetType = { ...state.draft, vocations };
      if (vocationSum > getLevelFromXP(state.draft.experience ?? 0)) {
        nextDraft = {
          ...nextDraft,
          experience: getXPForLevel(Math.min(MAX_XP_LEVEL, vocationSum)),
        };
      }
      return applyWrite(state, withRecomputedLevelCache(nextDraft));
    }
    case 'PATCH_EXPERIENCE': {
      const requested = Math.max(0, action.payload.experience ?? 0);
      const experience = Math.max(
        vocationXpFloor(state.draft.vocations),
        requested,
      );
      return applyWrite(
        state,
        withRecomputedLevelCache({ ...state.draft, experience }),
      );
    }
    case 'BEGIN_EDIT':
      return { ...state, editing: true, draft: state.character };
    case 'CANCEL_EDIT':
      return { ...state, editing: false, draft: state.character };
    case 'COMMIT_SAVE':
      return { ...state, editing: false, character: state.draft, dirty: true };
    case 'SYNC_CHARACTER': {
      if (state.editing) return state;
      const c = action.payload.character;
      return { ...state, character: c, draft: c, dirty: false };
    }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload.tab };
    default:
      return state;
  }
};
