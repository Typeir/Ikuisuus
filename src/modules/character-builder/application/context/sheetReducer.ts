/**
 * @fileoverview Active Sheet Reducer
 * @description Pure reducer for the active character sheet. Owns the
 * "experience is source of truth" invariant: `level` and `tierBonus`
 * are derived cache fields, always recomputed from
 * `max(getLevelFromXP(experience), sumVocationLevels(vocations))`. Increasing
 * vocation-level sum past the XP-derived level bumps `experience` up to the
 * corresponding XP threshold (the "vocation-sum floor"). Lowering XP is
 * clamped to that same floor. Generic `PATCH` strips direct writes to
 * `level` / `tierBonus` so consumers cannot desync the cache.
 *
 * Writes are never gated on edit mode. Edit mode only decides *where* a write
 * lands: while editing it updates the draft alone, so `cancelEdit` can throw it
 * away; otherwise it updates the saved character directly (live play — damage,
 * grit, hit-dice reconciliation — which the provider then persists). Deciding
 * which controls to offer is the consumer's job, via `editing`.
 *
 * @module lib/components/characterSheet/context/sheetReducer
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
 * @property {boolean} dirty - Whether `character` holds changes the roster has not been told about yet. Set by any write that lands on the saved character, cleared when a character is adopted from the roster. The provider pushes upstream on this flag alone — comparing `character` against the incoming prop instead would race, because the roster echoes every write back as a fresh object and the comparison would still see the pre-echo value for one commit.
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
 * Applies a computed draft to the state. While editing, the write lands on the
 * draft alone so `cancelEdit` can discard it. Outside edit mode there is no
 * transaction to join, so the write lands on the saved character too — the
 * write path is never gated on edit mode. Consumers decide which controls to
 * offer by reading `editing`; the reducer never silently swallows a write.
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
 * Refreshes the `level` and `tierBonus` caches from the draft's authoritative
 * `experience` and `vocations` fields, through the module's single derivation
 * authority so this reducer cannot define a level of its own.
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
