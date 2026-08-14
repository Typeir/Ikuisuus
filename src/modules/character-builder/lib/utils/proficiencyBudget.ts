/**
 * @fileoverview Skill proficiency counter & hint helpers.
 * @description Adapter over {@link module:modules/character-builder/lib/utils/assignableGrants}
 * providing the free-pick counter (via `unassignedByCategory`, skill/proficient
 * group) and per-table hint sets. Re-exports `deriveSkillOffer` /
 * `ProficiencyOffer`.
 *
 * @module modules/character-builder/lib/utils/proficiencyBudget
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
  collectAssignableGrants,
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
 * Row-keys per table to hint — the options of every `oneOf` grant in the
 * character's assignable grants, unioned per table. `any` grants contribute
 * no hint.
 *
 * @function deriveProficiencyHints
 * @param {CharacterSheet} character - Character to inspect
 * @returns {ProficiencyHints} Row-key sets to hint per table
 */
export function deriveProficiencyHints(
  character: CharacterSheet,
): ProficiencyHints {
  const skills = new Set<string>();
  const trades = new Set<string>();
  for (const grant of collectAssignableGrants(character)) {
    if (grant.choice.kind !== 'oneOf') continue;
    if (grant.category === 'skill') {
      for (const option of grant.choice.options) skills.add(option);
    } else if (grant.category === 'trade') {
      for (const option of grant.choice.options) trades.add(option);
    }
  }
  return { skills, trades };
}
