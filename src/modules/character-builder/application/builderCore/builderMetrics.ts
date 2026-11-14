/**
 * @fileoverview Pure flair metrics shared by builder UI components and the flag catalog.
 *
 * @module modules/character-builder/application/builderCore/builderMetrics
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type { CharacterShard, CharacterSheet } from '@/lib/types/character';
import type { CapacityThresholds } from '@/modules/character-builder/domain/carrying-capacity';
import { computeCapacity } from '@/modules/character-builder/infrastructure/carrying-capacity';
import type { UnassignedGroup } from '@/modules/character-builder/lib/utils/assignableGrants';
import { computeBpSpent } from '@/modules/character-builder/lib/utils/boonPoints';
import type { BuilderFlagCode, CarryOptions } from './types';

/**
 * Load tier of carried weight.
 *
 * @typedef {'none'|'light'|'medium'|'heavy'|'over'} LoadTier
 */
export type LoadTier = 'none' | 'light' | 'medium' | 'heavy' | 'over';

/**
 * Boon Point totals for a selection.
 *
 * @interface BpStatus
 * @property {number} budget - Bloodline BP budget
 * @property {number} spent - BP spent on selected boons
 * @property {number} remaining - `budget - spent`; negative when over budget
 * @property {boolean} over - True when `remaining < 0`
 */
export interface BpStatus {
  budget: number;
  spent: number;
  remaining: number;
  over: boolean;
}

/**
 * Carry totals for a character.
 *
 * @interface CarryStatus
 * @property {number} carriedLb - Equipment weight plus extra pounds
 * @property {CapacityThresholds} thresholds - Light, medium, and heavy limits in pounds
 * @property {LoadTier} tier - Load tier of `carriedLb`
 */
export interface CarryStatus {
  carriedLb: number;
  thresholds: CapacityThresholds;
  tier: LoadTier;
}

/**
 * Label keys and flag code for one shown unassigned group.
 *
 * @interface UnassignedLabel
 * @property {BuilderFlagCode} code - Flag code
 * @property {string} text - ICU plural text key
 * @property {string} aria - Aria label key
 */
export interface UnassignedLabel {
  code: BuilderFlagCode;
  text: string;
  aria: string;
}

/**
 * Unassigned groups the UI shows, keyed by `category:tier`; others stay data only.
 *
 * @constant UNASSIGNED_LABELS
 * @type {Readonly<Record<string, UnassignedLabel>>}
 */
export const UNASSIGNED_LABELS: Readonly<Record<string, UnassignedLabel>> = {
  'skill:proficient': {
    code: 'UNASSIGNED_SKILL_PROFICIENCY',
    text: 'unassignedProficiencies',
    aria: 'ariaUnassignedProficiencies',
  },
  'skill:expertise': {
    code: 'UNASSIGNED_SKILL_EXPERTISE',
    text: 'unassignedExpertise',
    aria: 'ariaUnassignedExpertise',
  },
  'trade:proficient': {
    code: 'UNASSIGNED_TRADE',
    text: 'unassignedTrades',
    aria: 'ariaUnassignedTrades',
  },
  'feat:': {
    code: 'UNASSIGNED_FEAT',
    text: 'unassignedFeats',
    aria: 'ariaUnassignedFeats',
  },
};

/**
 * Hardcoded English load labels shown by the carry widget.
 *
 * @constant LOAD_LABELS
 * @type {Readonly<Record<LoadTier, string>>}
 */
export const LOAD_LABELS: Readonly<Record<LoadTier, string>> = {
  none: 'No load',
  light: 'Light load',
  medium: 'Medium load',
  heavy: 'Heavy load',
  over: 'Over capacity',
};

/**
 * Flag code shown for a load tier; null for tiers without a red flair.
 *
 * @function loadFlagCode
 * @param {LoadTier} tier - Load tier
 * @returns {BuilderFlagCode | null} Flag code, or null
 */
export function loadFlagCode(tier: LoadTier): BuilderFlagCode | null {
  if (tier === 'over') return 'CARRY_OVER_CAPACITY';
  if (tier === 'heavy') return 'CARRY_HEAVY_LOAD';
  return null;
}

/**
 * Returns the `category:tier` key of an unassigned group.
 *
 * @function unassignedGroupKey
 * @param {UnassignedGroup} group - Unassigned group
 * @returns {string} Group key; tier part empty for feats
 */
export function unassignedGroupKey(group: UnassignedGroup): string {
  return `${group.category}:${group.tier ?? ''}`;
}

/**
 * Computes Boon Point totals for a selection.
 *
 * @function computeBpStatus
 * @param {CharacterShard[]} selectedBoons - Selected boon shards
 * @param {number} budget - Bloodline BP budget
 * @returns {BpStatus} BP totals
 */
export function computeBpStatus(
  selectedBoons: CharacterShard[],
  budget: number,
): BpStatus {
  const spent = computeBpSpent(selectedBoons);
  const remaining = budget - spent;
  return { budget, spent, remaining, over: remaining < 0 };
}

/**
 * Classifies carried pounds against capacity thresholds.
 *
 * @function classifyLoad
 * @param {number} carried - Carried pounds
 * @param {CapacityThresholds} thresholds - Load thresholds
 * @returns {LoadTier} Load tier
 */
export function classifyLoad(
  carried: number,
  thresholds: CapacityThresholds,
): LoadTier {
  if (carried <= 0) return 'none';
  if (carried <= thresholds.light) return 'light';
  if (carried <= thresholds.medium) return 'medium';
  if (carried <= thresholds.heavy) return 'heavy';
  return 'over';
}

/**
 * Sums equipment weight as quantity times pounds per unit.
 *
 * @function equipmentWeight
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Total equipment pounds
 */
export function equipmentWeight(character: CharacterSheet): number {
  return (character.equipment ?? []).reduce(
    (sum, item) => sum + item.quantity * item.weightLb,
    0,
  );
}

/**
 * Resolves carry inputs from the stored `carrying` field, overrides, and defaults.
 *
 * @function resolveCarrying
 * @param {CharacterSheet} character - Character to inspect
 * @param {CarryOptions} [overrides] - Inputs that win over the stored ones key by key
 * @returns {Required<CarryOptions>} Size, quadruped flag, and extra pounds
 */
export function resolveCarrying(
  character: CharacterSheet,
  overrides: CarryOptions = {},
): Required<CarryOptions> {
  const merged = { ...character.carrying, ...overrides };
  return {
    size: merged.size ?? 'medium',
    quadruped: merged.quadruped ?? false,
    extraLb: Math.max(0, merged.extraLb ?? 0),
  };
}

/**
 * Computes carry totals the way the carry widget does.
 *
 * @function computeCarryStatus
 * @param {CharacterSheet} character - Character to inspect
 * @param {CarryOptions} [overrides] - Inputs that win over the stored `carrying` field
 * @returns {CarryStatus} Carry totals
 */
export function computeCarryStatus(
  character: CharacterSheet,
  overrides?: CarryOptions,
): CarryStatus {
  const { size, quadruped, extraLb } = resolveCarrying(character, overrides);
  const total = equipmentWeight(character);
  const carriedLb = total > 0 ? total + extraLb : extraLb;
  const thresholds = computeCapacity(
    character.abilityScores?.str ?? 10,
    size,
    quadruped,
  );
  return { carriedLb, thresholds, tier: classifyLoad(carriedLb, thresholds) };
}
