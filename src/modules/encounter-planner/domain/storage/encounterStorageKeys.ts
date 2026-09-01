/**
 * @fileoverview Storage keys and hero affix constants for the encounter planner.
 * @description Enums of localStorage keys and heroic affix string values.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires None - Pure enum definitions
 *
 * @example
 * ```typescript
 * import { EncounterStorage, HeroicAffix } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';
 *
 * localStorage.setItem(EncounterStorage.Encounters, JSON.stringify(encounters));
 * const affixes = Object.values(HeroicAffix);
 * ```
 * @module modules/encounter-planner/domain/storage/encounterStorageKeys
 */

export enum EncounterStorage {
  Encounters = 'encounter-planner-data',
  ActiveEncounterId = 'encounter-planner-active-id',
  InProgressCombats = 'in-progress-combats',
  ActiveCombatId = 'active-combat-id',
  SavedParties = 'saved-parties',
}

/**
 * Heroic Awakening Affixes from Damocles Homebrew Rules
 * @enum {string} HeroicAffix
 * @see {@link src/content/en/rules/heroic-awakening/}
 */
export enum HeroicAffix {
  Bloodthirsty = 'Bloodthirsty',
  Championed = 'Championed',
  Crusading = 'Crusading',
  Flametongued = 'Flametongued',
  Frostveined = 'Frostveined',
  Psionic = 'Psionic',
  Rakish = 'Rakish',
  Stormbound = 'Stormbound',
  Sulphurous = 'Sulphurous',
}
