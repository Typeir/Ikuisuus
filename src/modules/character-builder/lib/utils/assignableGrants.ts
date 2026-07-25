/**
 * @fileoverview Assignable grants — the unified "unassigned benefits" model
 * @description One typed, derived array of every benefit a character is OWED but
 * must still ASSIGN: base skill picks, feature choice grants (e.g. Scholar's
 * "choose one → Expertise"), and feat/ASI slots. Each carries its category, tier,
 * choice-constraint, count, and source, so the UI can report per-category counts
 * ("N unassigned proficiencies / expertise / feats") with the verb "assign".
 *
 * A benefit is "assigned" when the character has a matching manual choice at or
 * above the granted tier that a deterministic grant floor does not already cover
 * (feature-floored proficiencies are free, not picks). Nothing is stored — this
 * is a pure derivation, so it is always fresh and needs no migration. Per the
 * Damocles training rules, the counts are advisory: no selector is ever disabled.
 *
 * @module modules/character-builder/lib/utils/assignableGrants
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type {
  CharacterShard,
  CharacterSheet,
  TierLevel,
} from '@/lib/types/character';
import { getTotalCharacterLevel } from './characterDerivation';
import { TIER_CYCLE } from './characterStorage';
import {
  countGlobalTierFeats,
  countVocationAsiFeats,
} from './featProgression';
import {
  collectActiveGrantShards,
  deriveGrantFloors,
  kebabToCamel,
  parseGrant,
  type GrantCategory,
  type ParsedGrant,
} from './grants';

/**
 * A vocation's free base-pick offer for one proficiency table.
 *
 * @interface ProficiencyOffer
 * @property {number} count - Number of free base picks the primary vocation grants
 * @property {boolean} any - True when picks may target ANY row (no restricted list)
 * @property {ReadonlySet<string>} keys - Offered row-keys; empty when `any` or no offer
 */
export interface ProficiencyOffer {
  count: number;
  any: boolean;
  keys: ReadonlySet<string>;
}

/**
 * How an assignable grant's target is chosen. Values are in the assignment
 * key-space (`skills.<camel>` / `tools.<camel>` / feat slug).
 *
 * @typedef {object} GrantChoice
 */
export type GrantChoice =
  | { kind: 'specific'; value: string }
  | { kind: 'oneOf'; options: string[] }
  | { kind: 'any' }
  | { kind: 'anyExcept'; deny: string[] };

/**
 * A benefit the character is owed and must assign.
 *
 * @interface AssignableGrant
 * @property {string} id - Stable id (source-derived)
 * @property {GrantCategory} category - Benefit kind
 * @property {TierLevel} [tier] - Granted tier for proficiency categories; omitted for feats
 * @property {GrantChoice} choice - How the target is chosen
 * @property {number} count - How many to assign
 * @property {string} source - Human label of the granting feature/vocation
 */
export interface AssignableGrant {
  id: string;
  category: GrantCategory;
  tier?: TierLevel;
  choice: GrantChoice;
  count: number;
  source: string;
}

/**
 * The unassigned tally for one `(category, tier)` group.
 *
 * @interface UnassignedGroup
 * @property {GrantCategory} category - Benefit kind
 * @property {TierLevel} [tier] - Tier for proficiency categories; omitted for feats
 * @property {number} count - Unassigned benefits in this group (> 0)
 */
export interface UnassignedGroup {
  category: GrantCategory;
  tier?: TierLevel;
  count: number;
}

/**
 * Derives the primary vocation's SKILL pick offer. An absent list (legacy /
 * unsynced entries) or an empty list with a non-zero count both mean "any skill";
 * a non-empty list is an explicit restricted offer.
 *
 * @function deriveSkillOffer
 * @param {CharacterSheet} character - Character to inspect
 * @returns {ProficiencyOffer} The primary vocation's skill offer
 */
export function deriveSkillOffer(character: CharacterSheet): ProficiencyOffer {
  const vocation = character.vocations[0];
  const count = vocation?.baseSkillChoiceCount ?? 0;
  const choices = vocation?.baseSkillChoices;
  const any = choices === undefined || choices.length === 0;
  return { count, any, keys: new Set(any ? [] : choices) };
}

/**
 * Maps a kebab grant value to the assignment key-space of its category
 * (`skills.<camel>` / `tools.<camel>`; other categories pass through unchanged).
 *
 * @function normalizeTarget
 * @param {GrantCategory} category - Benefit kind
 * @param {string} value - Kebab grant value (e.g. `sleight-of-hand`)
 * @returns {string} Assignment key
 */
function normalizeTarget(category: GrantCategory, value: string): string {
  if (category === 'skill') return `skills.${kebabToCamel(value)}`;
  if (category === 'trade') return `tools.${kebabToCamel(value)}`;
  return value;
}

/**
 * Converts a parsed choice-kind grant tag into a {@link GrantChoice} in the
 * assignment key-space.
 *
 * @function toChoice
 * @param {ParsedGrant} grant - A non-`specific` parsed grant tag
 * @returns {GrantChoice} The choice constraint
 */
function toChoice(grant: ParsedGrant): GrantChoice {
  if (grant.kind === 'oneOf') {
    return {
      kind: 'oneOf',
      options: grant.options.map((o) => normalizeTarget(grant.category, o)),
    };
  }
  if (grant.kind === 'anyExcept') {
    return {
      kind: 'anyExcept',
      deny: grant.deny.map((d) => normalizeTarget(grant.category, d)),
    };
  }
  if (grant.kind === 'specific') {
    return { kind: 'specific', value: normalizeTarget(grant.category, grant.value) };
  }
  return { kind: 'any' };
}

/**
 * Reports whether an assignment key satisfies a choice constraint.
 *
 * @function matchesChoice
 * @param {string} key - Assignment key (row-key or feat slug)
 * @param {GrantChoice} choice - The choice constraint
 * @returns {boolean} True when the key is an allowed target
 */
function matchesChoice(key: string, choice: GrantChoice): boolean {
  switch (choice.kind) {
    case 'specific':
      return key === choice.value;
    case 'oneOf':
      return choice.options.includes(key);
    case 'anyExcept':
      return !choice.deny.includes(key);
    case 'any':
      return true;
  }
}

/**
 * Extracts a feat slug from a selected-feat shard's source file path.
 *
 * @function featSlug
 * @param {CharacterShard} shard - Selected feat shard
 * @returns {string} Feat slug, or `''` when not resolvable
 */
function featSlug(shard: CharacterShard): string {
  const match = shard.sourceFile?.match(/feats\/(.+?)\.mdx$/);
  return match ? match[1] : '';
}

/**
 * Collects every assignable benefit a character is owed: the primary vocation's
 * base skill picks, feature choice grants (choice-kind tags on active shards),
 * and earned feat/ASI slots.
 *
 * @function collectAssignableGrants
 * @param {CharacterSheet} character - Character to inspect
 * @returns {AssignableGrant[]} Assignable benefits (deterministic grants excluded)
 */
export function collectAssignableGrants(
  character: CharacterSheet,
): AssignableGrant[] {
  const grants: AssignableGrant[] = [];

  const skillOffer = deriveSkillOffer(character);
  if (skillOffer.count > 0) {
    grants.push({
      id: 'base:skill',
      category: 'skill',
      tier: 'proficient',
      choice: skillOffer.any
        ? { kind: 'any' }
        : { kind: 'oneOf', options: [...skillOffer.keys] },
      count: skillOffer.count,
      source: character.vocations[0]?.title ?? '',
    });
  }

  for (const shard of collectActiveGrantShards(character)) {
    for (const tag of shard.grants ?? []) {
      const parsed = parseGrant(tag);
      if (
        !parsed ||
        (parsed.kind !== 'oneOf' &&
          parsed.kind !== 'any' &&
          parsed.kind !== 'anyExcept')
      ) {
        continue;
      }
      grants.push({
        id: `feature:${shard.id}:${tag}`,
        category: parsed.category,
        tier: parsed.category === 'feat' ? undefined : parsed.tier,
        choice: toChoice(parsed),
        count: parsed.count,
        source: shard.heading,
      });
    }
  }

  const vocationFeats = countVocationAsiFeats(character);
  if (vocationFeats > 0) {
    grants.push({
      id: 'progression:feat-vocation',
      category: 'feat',
      choice: { kind: 'any' },
      count: vocationFeats,
      source: 'Vocation',
    });
  }
  const tierFeats = countGlobalTierFeats(getTotalCharacterLevel(character));
  if (tierFeats > 0) {
    grants.push({
      id: 'progression:feat-tier',
      category: 'feat',
      choice: { kind: 'anyExcept', deny: ['ability-score-improvement'] },
      count: tierFeats,
      source: 'Tier bonus',
    });
  }

  return grants;
}

/**
 * Counts how many of an assignable grant's `count` the character has already
 * assigned. For proficiency categories: skills/tools matching the choice at or
 * above the granted tier that no floor already covers at that tier. For feats:
 * selected feats matching the choice. Capped at `grant.count`.
 *
 * @function countAssigned
 * @param {AssignableGrant} grant - The grant to check
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Assigned benefits, in `[0, grant.count]`
 */
export function countAssigned(
  grant: AssignableGrant,
  character: CharacterSheet,
): number {
  if (grant.category === 'feat') {
    const matching = (character.selectedFeats ?? []).filter((shard) =>
      matchesChoice(featSlug(shard), grant.choice),
    ).length;
    return Math.min(matching, grant.count);
  }

  const items =
    grant.category === 'skill'
      ? character.skills
      : grant.category === 'trade'
        ? character.tools
        : [];
  const floors = deriveGrantFloors(character);
  const floorMap =
    grant.category === 'skill'
      ? floors.skills
      : grant.category === 'trade'
        ? floors.tools
        : {};
  const tierIndex = TIER_CYCLE.indexOf(grant.tier ?? 'proficient');

  let assigned = 0;
  for (const item of items) {
    if (!matchesChoice(item.name, grant.choice)) continue;
    if (TIER_CYCLE.indexOf(item.tier) < tierIndex) continue;
    const floor = floorMap[item.name] ?? 'none';
    if (TIER_CYCLE.indexOf(floor) >= tierIndex) continue;
    assigned++;
  }
  return Math.min(assigned, grant.count);
}

/**
 * Counts the feat/ASI slots a character has NOT filled, honoring that
 * ability-score-improvement can only fill slots that allow it (vocation slots),
 * not the tier-bonus slots that deny it. A single greedy matching: ASI feats fill
 * only ASI-allowed slots; other feats fill ASI-denied slots first (to preserve
 * allowed slots for ASI), then any remaining allowed slots.
 *
 * @function unassignedFeatSlots
 * @param {AssignableGrant[]} featGrants - The character's feat-category grants
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Unfilled feat slots
 */
function unassignedFeatSlots(
  featGrants: AssignableGrant[],
  character: CharacterSheet,
): number {
  let asiAllowed = 0;
  let asiDenied = 0;
  for (const grant of featGrants) {
    if (matchesChoice('ability-score-improvement', grant.choice)) {
      asiAllowed += grant.count;
    } else {
      asiDenied += grant.count;
    }
  }
  const selected = character.selectedFeats ?? [];
  const asi = selected.filter(
    (shard) => featSlug(shard) === 'ability-score-improvement',
  ).length;
  const other = selected.length - asi;
  const asiFilled = Math.min(asi, asiAllowed);
  const otherInDenied = Math.min(other, asiDenied);
  const otherInAllowed = Math.min(
    other - otherInDenied,
    asiAllowed - asiFilled,
  );
  const filled = asiFilled + otherInDenied + otherInAllowed;
  return Math.max(0, asiAllowed + asiDenied - filled);
}

/**
 * Aggregates the character's unassigned benefits by `(category, tier)`. Feats are
 * pooled through a slot-matching pass (see {@link unassignedFeatSlots}) so ASI's
 * restriction to vocation slots is respected; other categories sum per grant.
 *
 * @function unassignedByCategory
 * @param {CharacterSheet} character - Character to inspect
 * @returns {UnassignedGroup[]} One entry per group with a positive unassigned count
 */
export function unassignedByCategory(
  character: CharacterSheet,
): UnassignedGroup[] {
  const all = collectAssignableGrants(character);
  const groups = new Map<string, UnassignedGroup>();
  for (const grant of all) {
    if (grant.category === 'feat') continue;
    const unassigned = Math.max(0, grant.count - countAssigned(grant, character));
    if (unassigned === 0) continue;
    const key = `${grant.category}:${grant.tier ?? ''}`;
    const existing = groups.get(key);
    if (existing) existing.count += unassigned;
    else groups.set(key, { category: grant.category, tier: grant.tier, count: unassigned });
  }
  const featUnassigned = unassignedFeatSlots(
    all.filter((grant) => grant.category === 'feat'),
    character,
  );
  if (featUnassigned > 0) {
    groups.set('feat:', { category: 'feat', count: featUnassigned });
  }
  return [...groups.values()];
}
