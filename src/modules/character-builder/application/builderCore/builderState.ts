/**
 * @fileoverview Assembles every derived builder value into one JSON-safe state object.
 *
 * @module modules/character-builder/application/builderCore/builderState
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type { CharacterShard, CharacterSheet } from '@/lib/types/character';
import {
  collectAssignableGrants,
  countAssigned,
  unassignedByCategory,
  type AssignableGrant,
  type UnassignedGroup,
} from '@/modules/character-builder/lib/utils/assignableGrants';
import {
  getCharacterDerived,
  type CharacterDerived,
} from '@/modules/character-builder/lib/utils/characterDerivation';
import {
  deriveActiveGrants,
  deriveGrantFloors,
  type DerivedGrants,
  type GrantFloors,
} from '@/modules/character-builder/lib/utils/grants';
import {
  deriveHitPoints,
  type DerivedHitPoints,
} from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { deriveProficiencyHints } from '@/modules/character-builder/lib/utils/proficiencyBudget';
import {
  computeBpStatus,
  computeCarryStatus,
  type BpStatus,
  type CarryStatus,
} from './builderMetrics';
import type { CarryOptions } from './types';

/**
 * Assignable grant with its assigned tally.
 *
 * @interface AssignableGrantState
 * @property {number} assigned - Picks already assigned, in [0, count]
 */
export interface AssignableGrantState extends AssignableGrant {
  assigned: number;
}

/**
 * Grant system output.
 *
 * @interface GrantState
 * @property {DerivedGrants} granted - Grants from unlocked features and feats
 * @property {GrantFloors} floors - Display floors applied to the tables
 * @property {AssignableGrantState[]} assignable - Choice grants with tallies
 * @property {UnassignedGroup[]} unassigned - Open picks per `(category, tier)`, shown or not
 * @property {{ skills: string[]; trades: string[] }} hints - Row-keys marked as vocation picks
 */
export interface GrantState {
  granted: DerivedGrants;
  floors: GrantFloors;
  assignable: AssignableGrantState[];
  unassigned: UnassignedGroup[];
  hints: { skills: string[]; trades: string[] };
}

/**
 * Feature shard with its unlock status.
 *
 * @interface FeatureState
 * @property {string} id - Shard id
 * @property {string} heading - Feature name
 * @property {CharacterShard['category']} category - Shard category
 * @property {number} level - Feature level
 * @property {number} vocationIndex - Index of the owning vocation entry
 * @property {boolean} unlocked - True when `level <= vocation level`
 */
export interface FeatureState {
  id: string;
  heading: string;
  category: CharacterShard['category'];
  level: number;
  vocationIndex: number;
  unlocked: boolean;
}

/**
 * Full computed builder state.
 *
 * @interface BuilderState
 * @property {CharacterDerived} level - XP and level block
 * @property {BpStatus} boonPoints - BP totals
 * @property {GrantState} grants - Grant system output
 * @property {FeatureState[]} features - Vocation and specialization features
 * @property {DerivedHitPoints} hitPoints - Derived max HP
 * @property {CarryStatus} carry - Carry totals
 */
export interface BuilderState {
  level: CharacterDerived;
  boonPoints: BpStatus;
  grants: GrantState;
  features: FeatureState[];
  hitPoints: DerivedHitPoints;
  carry: CarryStatus;
}

/**
 * Lists every vocation and specialization feature with its unlock status.
 *
 * @function collectFeatureStates
 * @param {CharacterSheet} character - Character to inspect
 * @returns {FeatureState[]} Features in vocation order
 */
export function collectFeatureStates(character: CharacterSheet): FeatureState[] {
  return character.vocations.flatMap((vocation, vocationIndex) =>
    [...vocation.vocationFeatures, ...vocation.specializationFeatures].map(
      (shard) => ({
        id: shard.id,
        heading: shard.heading,
        category: shard.category,
        level: shard.level ?? 1,
        vocationIndex,
        unlocked: (shard.level ?? 1) <= vocation.level,
      }),
    ),
  );
}

/**
 * Computes the grant system output.
 *
 * @function computeGrantState
 * @param {CharacterSheet} character - Character to inspect
 * @returns {GrantState} Grant output
 */
export function computeGrantState(character: CharacterSheet): GrantState {
  const hints = deriveProficiencyHints(character);
  return {
    granted: deriveActiveGrants(character),
    floors: deriveGrantFloors(character),
    assignable: collectAssignableGrants(character).map((grant) => ({
      ...grant,
      assigned: countAssigned(grant, character),
    })),
    unassigned: unassignedByCategory(character),
    hints: { skills: [...hints.skills], trades: [...hints.trades] },
  };
}

/**
 * Computes the full builder state for a character.
 *
 * @function computeBuilderState
 * @param {CharacterSheet} character - Character to inspect
 * @param {CarryOptions} [carry] - Overrides for the stored carry inputs
 * @returns {BuilderState} JSON-safe state
 */
export function computeBuilderState(
  character: CharacterSheet,
  carry?: CarryOptions,
): BuilderState {
  return {
    level: getCharacterDerived(character),
    boonPoints: computeBpStatus(
      character.selectedBoons ?? [],
      character.boonBudget ?? 0,
    ),
    grants: computeGrantState(character),
    features: collectFeatureStates(character),
    hitPoints: deriveHitPoints(character),
    carry: computeCarryStatus(character, carry),
  };
}
