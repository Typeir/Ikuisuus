/**
 * Character Sheet State Types and Action Schema
 *
 * @fileoverview Defines typed state shapes and action types for the character sheet
 * persistent state system, stored via fetchPersistentData / storePersistentData.
 *
 * @module lib/types/characterSheet
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/types/character
 */

import type { CharacterSheet } from '@/lib/types/character';

/**
 * Storage key used by fetchPersistentData / storePersistentData for the character array.
 * Reads fall through cookie → sessionStorage → localStorage; the cookie layer rejects
 * data too large for it.
 *
 * @constant CHARACTER_SHEET_STORAGE_KEY
 */
export const CHARACTER_SHEET_STORAGE_KEY = 'ikuisuus-characters' as const;

/**
 * Action type constants for character sheet state management.
 *
 * @constant CHARACTER_SHEET_ACTION_TYPES
 */
export const CHARACTER_SHEET_ACTION_TYPES = {
  UPSERT_CHARACTER: 'CHARACTER_SHEET/UPSERT_CHARACTER',
  DELETE_CHARACTER: 'CHARACTER_SHEET/DELETE_CHARACTER',
  SET_ACTIVE_ID: 'CHARACTER_SHEET/SET_ACTIVE_ID',
  RESET: 'CHARACTER_SHEET/RESET',
  HYDRATE: 'CHARACTER_SHEET/HYDRATE',
} as const;

/**
 * Complete character sheet module state shape
 *
 * @interface CharacterSheetState
 * @property {CharacterSheet[]} characters - All saved character sheets
 * @property {string | null} activeId - ID of the currently viewed/edited character, or null
 * @property {boolean} isHydrated - Whether state has been hydrated from storage
 */
export interface CharacterSheetState {
  characters: CharacterSheet[];
  activeId: string | null;
  isHydrated: boolean;
}

/**
 * Action to add or replace a character by ID.
 * If a character with the same ID exists it is replaced; otherwise appended.
 * The updatedAt timestamp is set to now on every upsert.
 *
 * @interface UpsertCharacterAction
 * @property {typeof CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER} type - Action type identifier
 * @property {{ character: CharacterSheet }} payload - Character to upsert
 */
export interface UpsertCharacterAction {
  type: typeof CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER;
  payload: { character: CharacterSheet };
}

/**
 * Action to remove a character by ID.
 * If activeId matches the deleted character, activeId is set to null.
 *
 * @interface DeleteCharacterAction
 * @property {typeof CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER} type - Action type identifier
 * @property {{ id: string }} payload - ID of the character to delete
 */
export interface DeleteCharacterAction {
  type: typeof CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER;
  payload: { id: string };
}

/**
 * Action to set the active character ID.
 *
 * @interface SetActiveIdAction
 * @property {typeof CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID} type - Action type identifier
 * @property {{ id: string | null }} payload - ID to activate, or null to deselect
 */
export interface SetActiveIdAction {
  type: typeof CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID;
  payload: { id: string | null };
}

/**
 * Action to reset all character sheet state to defaults.
 *
 * @interface ResetCharacterSheetAction
 * @property {typeof CHARACTER_SHEET_ACTION_TYPES.RESET} type - Action type identifier
 */
export interface ResetCharacterSheetAction {
  type: typeof CHARACTER_SHEET_ACTION_TYPES.RESET;
}

/**
 * Action to hydrate state from persistent storage.
 * Fires once client-side, replacing the initial SSR state with stored data.
 *
 * @interface HydrateCharacterSheetAction
 * @property {typeof CHARACTER_SHEET_ACTION_TYPES.HYDRATE} type - Action type identifier
 * @property {{ characters: CharacterSheet[]; activeId: string | null }} payload - Persisted state to restore
 */
export interface HydrateCharacterSheetAction {
  type: typeof CHARACTER_SHEET_ACTION_TYPES.HYDRATE;
  payload: { characters: CharacterSheet[]; activeId: string | null };
}

/**
 * Union of all character sheet actions.
 *
 * @typedef {UpsertCharacterAction | DeleteCharacterAction | SetActiveIdAction | ResetCharacterSheetAction | HydrateCharacterSheetAction} CharacterSheetAction
 */
export type CharacterSheetAction =
  | UpsertCharacterAction
  | DeleteCharacterAction
  | SetActiveIdAction
  | ResetCharacterSheetAction
  | HydrateCharacterSheetAction;

/**
 * Default initial state for the character sheet module.
 *
 * @constant DEFAULT_CHARACTER_SHEET_STATE
 * @type {CharacterSheetState}
 */
export const DEFAULT_CHARACTER_SHEET_STATE: CharacterSheetState = {
  characters: [],
  activeId: null,
  isHydrated: false,
};
