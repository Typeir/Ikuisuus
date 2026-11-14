/**
 * @fileoverview Advisory flag catalog shared by the window bridge and the dev API.
 *
 * @module modules/character-builder/application/builderCore/builderFlags
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import characterSheetMessages from '../../../../../messages/en/characterSheet.json';
import type { CharacterSheet } from '@/lib/types/character';
import {
  collectAssignableGrants,
  countAssigned,
  unassignedByCategory,
  type AssignableGrant,
  type UnassignedGroup,
} from '@/modules/character-builder/lib/utils/assignableGrants';
import { getCharacterDerived } from '@/modules/character-builder/lib/utils/characterDerivation';
import { createTranslator } from 'next-intl';
import {
  LOAD_LABELS,
  UNASSIGNED_LABELS,
  computeBpStatus,
  computeCarryStatus,
  loadFlagCode,
  unassignedGroupKey,
} from './builderMetrics';
import type {
  BuilderFlag,
  BuilderFlagCode,
  BuilderFlagFeature,
  BuilderFlagSource,
  CarryOptions,
} from './types';

const translate = createTranslator({
  locale: 'en',
  messages: { characterSheet: characterSheetMessages },
  namespace: 'characterSheet',
});

/**
 * Formats a `characterSheet` message in English.
 *
 * @function formatSheetMessage
 * @param {string} key - `characterSheet` message key
 * @param {Record<string, number>} params - ICU params
 * @returns {string} Formatted English text
 */
export function formatSheetMessage(
  key: string,
  params: Record<string, number>,
): string {
  return (translate as unknown as (k: string, p: Record<string, number>) => string)(
    key,
    params,
  );
}

/**
 * Builds a flag from a message key.
 *
 * @function keyedFlag
 * @param {BuilderFlagCode} code - Flag code
 * @param {string} messageKey - `characterSheet` key
 * @param {Record<string, number>} params - ICU params
 * @param {BuilderFlagSource} source - Flag origin
 * @returns {BuilderFlag} Flag
 */
function keyedFlag(
  code: BuilderFlagCode,
  messageKey: string,
  params: Record<string, number>,
  source: BuilderFlagSource,
): BuilderFlag {
  return {
    code,
    severity: 'warning',
    messageKey,
    params,
    message: formatSheetMessage(messageKey, params),
    source,
  };
}

/**
 * Returns the features that feed one unassigned group.
 *
 * @function groupFeatures
 * @param {UnassignedGroup} group - Unassigned group
 * @param {AssignableGrant[]} grants - All assignable grants
 * @param {CharacterSheet} character - Character to inspect
 * @returns {BuilderFlagFeature[]} Granting features with open picks
 */
function groupFeatures(
  group: UnassignedGroup,
  grants: AssignableGrant[],
  character: CharacterSheet,
): BuilderFlagFeature[] {
  if (group.category === 'feat') {
    return grants
      .filter((grant) => grant.category === 'feat')
      .map((grant) => ({ id: grant.id, label: grant.source }));
  }
  return grants
    .filter(
      (grant) =>
        grant.category === group.category &&
        grant.tier === group.tier &&
        countAssigned(grant, character) < grant.count,
    )
    .map((grant) => ({ id: grant.id, label: grant.source }));
}

/**
 * Builds the BP flag when the selection is over budget.
 *
 * @function bpFlags
 * @param {CharacterSheet} character - Character to inspect
 * @returns {BuilderFlag[]} Zero or one flag
 */
function bpFlags(character: CharacterSheet): BuilderFlag[] {
  const boons = character.selectedBoons ?? [];
  const bp = computeBpStatus(boons, character.boonBudget ?? 0);
  if (!bp.over) return [];
  return [
    keyedFlag(
      'BP_OVER_BUDGET',
      'bpOverBudget',
      { amount: Math.abs(bp.remaining) },
      {
        kind: 'boons',
        features: boons.map((shard) => ({ id: shard.id, label: shard.heading })),
      },
    ),
  ];
}

/**
 * Builds the unassigned-levels flag.
 *
 * @function levelFlags
 * @param {CharacterSheet} character - Character to inspect
 * @returns {BuilderFlag[]} Zero or one flag
 */
function levelFlags(character: CharacterSheet): BuilderFlag[] {
  const derived = getCharacterDerived(character);
  if (!derived.hasUnassignedLevels) return [];
  return [
    keyedFlag(
      'UNASSIGNED_LEVELS',
      'unassignedVocationsWarning',
      { count: derived.unassignedLevels },
      {
        kind: 'vocations',
        features: character.vocations
          .filter((v) => Boolean(v.slug))
          .map((v) => ({ id: v.slug, label: v.title })),
      },
    ),
  ];
}

/**
 * Builds one flag per shown unassigned grant group.
 *
 * @function grantFlags
 * @param {CharacterSheet} character - Character to inspect
 * @returns {BuilderFlag[]} Flags in group order
 */
function grantFlags(character: CharacterSheet): BuilderFlag[] {
  const grants = collectAssignableGrants(character);
  return unassignedByCategory(character).flatMap((group) => {
    const label = UNASSIGNED_LABELS[unassignedGroupKey(group)];
    if (!label) return [];
    return [
      keyedFlag(
        label.code,
        label.text,
        { count: group.count },
        { kind: 'grants', features: groupFeatures(group, grants, character) },
      ),
    ];
  });
}

/**
 * Builds the carry flag for heavy or over loads.
 *
 * @function carryFlags
 * @param {CharacterSheet} character - Character to inspect
 * @param {CarryOptions} [options] - Overrides for the stored carry inputs
 * @returns {BuilderFlag[]} Zero or one flag
 */
function carryFlags(
  character: CharacterSheet,
  options?: CarryOptions,
): BuilderFlag[] {
  const carry = computeCarryStatus(character, options);
  const code = loadFlagCode(carry.tier);
  if (!code) return [];
  return [
    {
      code,
      severity: 'warning',
      messageKey: null,
      params: { carriedLb: carry.carriedLb, heavyLb: carry.thresholds.heavy },
      message: LOAD_LABELS[carry.tier],
      source: {
        kind: 'equipment',
        features: (character.equipment ?? []).map((item) => ({
          id: item.id,
          label: item.name,
        })),
      },
    },
  ];
}

/**
 * Computes every advisory flag for a character, in fixed order.
 *
 * @function computeBuilderFlags
 * @param {CharacterSheet} character - Character to inspect
 * @param {CarryOptions} [carry] - Overrides for the stored carry inputs
 * @returns {BuilderFlag[]} Flags; empty when nothing is flagged
 */
export function computeBuilderFlags(
  character: CharacterSheet,
  carry?: CarryOptions,
): BuilderFlag[] {
  return [
    ...bpFlags(character),
    ...levelFlags(character),
    ...grantFlags(character),
    ...carryFlags(character, carry),
  ];
}
