/**
 * @fileoverview Skill proficiency budget & hint helpers
 * @description Thin adapter over the unified {@link module:modules/character-builder/lib/utils/assignableGrants}
 * model for the skill table's two skill-specific concerns: the free-pick counter
 * (delegated to `unassignedByCategory`, skill/proficient group) and the hint set
 * for the vocation's offered skills. See `assignableGrants` for the general model
 * and the rules rationale (a pick is charged only on-offer, ≥ proficient, and not
 * feature-floored; nothing is ever disabled). Re-exports `deriveSkillOffer` /
 * `ProficiencyOffer` for callers that still consume the skill offer directly.
 *
 * @module modules/character-builder/lib/utils/proficiencyBudget
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
  deriveSkillOffer,
  unassignedByCategory,
} from './assignableGrants';

export { deriveSkillOffer };
export type { ProficiencyOffer } from './assignableGrants';

/**
 * Row-keys that should show a "vocation pick" hint marker per table.
 *
 * @interface ProficiencyHints
 * @property {ReadonlySet<string>} skills - Skill row-keys to hint
 * @property {ReadonlySet<string>} trades - Trade row-keys to hint
 */
export interface ProficiencyHints {
  skills: ReadonlySet<string>;
  trades: ReadonlySet<string>;
}

/**
 * Free skill picks the character's primary vocation grants.
 *
 * @function countGrantedSkillProficiencies
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Granted skill-pick slots (0 when there is no primary vocation)
 */
export function countGrantedSkillProficiencies(
  character: CharacterSheet,
): number {
  return deriveSkillOffer(character).count;
}

/**
 * Free skill picks the character still has to assign (skill/proficient group of
 * the unified unassigned tally), clamped at 0.
 *
 * @function countUnspentSkillProficiencies
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Unassigned skill-pick slots
 */
export function countUnspentSkillProficiencies(
  character: CharacterSheet,
): number {
  return (
    unassignedByCategory(character).find(
      (group) => group.category === 'skill' && group.tier === 'proficient',
    )?.count ?? 0
  );
}

/**
 * Free skill picks the player has assigned: granted minus unassigned.
 *
 * @function countSpentSkillProficiencies
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Assigned skill picks
 */
export function countSpentSkillProficiencies(
  character: CharacterSheet,
): number {
  return (
    countGrantedSkillProficiencies(character) -
    countUnspentSkillProficiencies(character)
  );
}

/**
 * Row-keys that should show a "vocation pick" hint marker: the primary vocation's
 * offered skills, but ONLY when the offer is an EXPLICIT restricted list — an
 * unrestricted ("any") or absent offer yields an empty set. Trades are always
 * empty in current content (no vocation restricts trade choice to a list); the
 * field is present so the tables stay symmetric.
 *
 * @function deriveProficiencyHints
 * @param {CharacterSheet} character - Character to inspect
 * @returns {ProficiencyHints} Row-key sets to hint per table
 */
export function deriveProficiencyHints(
  character: CharacterSheet,
): ProficiencyHints {
  const skillOffer = deriveSkillOffer(character);
  return {
    skills: skillOffer.any ? new Set<string>() : new Set(skillOffer.keys),
    trades: new Set<string>(),
  };
}
