/**
 * @fileoverview Encounter Planner Enums - Storage keys and constants for encounter data
 * @description Defines standardized enums for encounter planner persistence and heroic affixes.
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
 * @module src/lib/enums/encounterPlanner
 */

export enum EncounterStorage {
  Encounters = 'encounter-planner-data',
  ActiveEncounterId = 'encounter-planner-active-id',
  InProgressCombats = 'in-progress-combats',
  ActiveCombatId = 'active-combat-id',
  SavedParties = 'saved-parties',
}

/**
 * Heroic Awakening Affixes from D&D Homebrew Rules
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
