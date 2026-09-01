/**
 * @fileoverview Public API barrel for the encounter-planner module.
 * @description All external consumers MUST import from this path only.
 * Internal sub-paths are not part of the public API.
 *
 * @module modules/encounter-planner/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

export type {
  AffixEntry,
  CreatureEntry,
  CreatureStats,
  Encounter
} from './domain/encounters/encounter.types';

export type {
  CombatantMechanics,
  InProgressCombat,
  InProgressCombatant
} from './domain/combat/inProgressCombat.types';

export type { SavedParty } from './domain/parties/party.types';

export {
  EncounterStorage,
  HeroicAffix
} from './domain/storage/encounterStorageKeys';

export { generateId } from './domain/shared/utils';

export type { ComboboxItem } from './presentation/comboboxes/genericCombobox';

export {
  fetchAffixIndex,
  fetchMonsterIndex,
  fetchSpellBySlug,
  fetchSpellIndex
} from './infrastructure/services/encounterDataService';

export type {
  AffixIndexEntry,
  MonsterIndexEntry,
  SpellIndexEntry
} from './infrastructure/services/encounterDataService';

