/**
 * @fileoverview Active Sheet Reducer
 * @description Pure reducer for the active character sheet. Owns the
 * "experience is source of truth" invariant: `level` and `proficiencyBonus`
 * are derived cache fields, always recomputed from
 * `max(getLevelFromXP(experience), sumVocationLevels(vocations))`. Increasing
 * vocation-level sum past the XP-derived level bumps `experience` up to the
 * corresponding XP threshold (the "vocation-sum floor"). Lowering XP is
 * clamped to that same floor. Generic `PATCH` strips direct writes to
 * `level` / `proficiencyBonus` so consumers cannot desync the cache.
 *
 * @module lib/components/characterSheet/context/sheetReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { computeProficiencyBonus } from '@/lib/utils/characterStorage';
import {
    getLevelFromXP,
    getXPForLevel,
    MAX_XP_LEVEL,
} from '@/lib/utils/xpProgression';

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
export interface SheetReducerState {
  character: CharacterSheetType;
  draft: CharacterSheetType;
  editing: boolean;
  activeTab: SheetTabId;
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
 * Sums the `level` field of every vocation entry with a non-empty slug.
 *
 * @function sumVocationLevels
 * @param {CharacterSheetType['vocations']} vocations - Vocation entries
 * @returns {number} Allocated vocation level (0 when no slugs)
 */
export const sumVocationLevels = (
  vocations: CharacterSheetType['vocations'],
): number =>
  vocations
    .filter((v) => Boolean(v.slug))
    .reduce((sum, v) => sum + (v.level ?? 0), 0);

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
 * Recomputes the cache fields `level` and `proficiencyBonus` from the draft's
 * authoritative `experience` and `vocations` fields.
 *
 * @function withRecomputedLevelCache
 * @param {CharacterSheetType} draft - Draft to normalize
 * @returns {CharacterSheetType} Draft with `level` and `proficiencyBonus` synced
 */
const withRecomputedLevelCache = (
  draft: CharacterSheetType,
): CharacterSheetType => {
  const xpLevel = getLevelFromXP(draft.experience ?? 0);
  const vocationSum = sumVocationLevels(draft.vocations);
  const effectiveLevel = Math.min(
    MAX_XP_LEVEL,
    Math.max(1, xpLevel, vocationSum),
  );
  return {
    ...draft,
    level: effectiveLevel,
    proficiencyBonus: computeProficiencyBonus(effectiveLevel),
  };
};

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
        proficiencyBonus: _pb,
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
      return { ...state, draft: withRecomputedLevelCache(next) };
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
      const vocationSum = sumVocationLevels(vocations);
      let nextDraft: CharacterSheetType = { ...state.draft, vocations };
      if (vocationSum > getLevelFromXP(state.draft.experience ?? 0)) {
        nextDraft = {
          ...nextDraft,
          experience: getXPForLevel(Math.min(MAX_XP_LEVEL, vocationSum)),
        };
      }
      return { ...state, draft: withRecomputedLevelCache(nextDraft) };
    }
    case 'PATCH_EXPERIENCE': {
      const requested = Math.max(0, action.payload.experience ?? 0);
      const experience = Math.max(
        vocationXpFloor(state.draft.vocations),
        requested,
      );
      return {
        ...state,
        draft: withRecomputedLevelCache({ ...state.draft, experience }),
      };
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
