/**
 * Character Sheet Reducer
 *
 * @fileoverview Pure reducer function for character sheet state management.
 * Handles all state transitions: upsert, delete, active selection, and reset.
 *
 * @module lib/reducers/characterSheetReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/types/characterSheet
 */

import {
    CHARACTER_SHEET_ACTION_TYPES,
    DEFAULT_CHARACTER_SHEET_STATE,
    type CharacterSheetAction,
    type CharacterSheetState,
} from '../types/characterSheet';
import { getTotalCharacterLevel } from '../utils/characterDerivation';
import { getXPForLevel, MAX_XP_LEVEL } from '../utils/xpProgression';

/**
 * Pure reducer for character sheet state.
 *
 * @function characterSheetReducer
 * @param {CharacterSheetState} state - Current state
 * @param {CharacterSheetAction} action - Action to process
 * @returns {CharacterSheetState} New state after applying the action
 *
 * @description
 * Handles the following action types:
 * - UPSERT_CHARACTER: Add or replace a character by ID; refreshes updatedAt
 * - DELETE_CHARACTER: Remove a character by ID; clears activeId if it matched
 * - SET_ACTIVE_ID: Set which character is currently viewed or edited
 * - RESET: Return to DEFAULT_CHARACTER_SHEET_STATE
 */
export function characterSheetReducer(
  state: CharacterSheetState,
  action: CharacterSheetAction,
): CharacterSheetState {
  switch (action.type) {
    case CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER: {
      const { character } = action.payload;
      const normalizedLevel = getTotalCharacterLevel(character);
      const hasActiveVocations = character.vocations.some((v) =>
        Boolean(v.slug),
      );
      const floor = getXPForLevel(Math.min(normalizedLevel, MAX_XP_LEVEL));
      const normalizedExperience = hasActiveVocations
        ? Math.max(character.experience ?? 0, floor)
        : character.experience ?? 0;
      const updated = {
        ...character,
        level: normalizedLevel,
        experience: normalizedExperience,
        updatedAt: new Date().toISOString(),
      };
      const index = state.characters.findIndex((c) => c.id === character.id);
      const characters =
        index >= 0
          ? state.characters.map((c, i) => (i === index ? updated : c))
          : [...state.characters, updated];
      return { ...state, characters };
    }

    case CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER: {
      const { id } = action.payload;
      const characters = state.characters.filter((c) => c.id !== id);
      const activeId = state.activeId === id ? null : state.activeId;
      return { ...state, characters, activeId };
    }

    case CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID: {
      return { ...state, activeId: action.payload.id };
    }

    case CHARACTER_SHEET_ACTION_TYPES.RESET: {
      return { ...DEFAULT_CHARACTER_SHEET_STATE };
    }

    case CHARACTER_SHEET_ACTION_TYPES.HYDRATE: {
      return {
        ...state,
        characters: action.payload.characters,
        activeId: action.payload.activeId,
        isHydrated: true,
      };
    }

    default: {
      return state;
    }
  }
}
