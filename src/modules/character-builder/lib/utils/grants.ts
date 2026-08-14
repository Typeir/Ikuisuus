/**
 * @fileoverview Feature Grant Utilities
 * @description Parses `grants: string[]` tags of the form `category:value[:tier]`
 * and derives the proficiencies a set of features confers. Tags are flat
 * strings; no rule-specific DB relations.
 *
 * @module modules/character-builder/lib/utils/grants
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type {
  AbilityKey,
  CharacterShard,
  CharacterSheet,
  TierLevel,
} from '@/lib/types/character';
import { TIER_CYCLE } from './characterStorage';
import { parseHpGrant, type HpValueGrant } from './hpGrants';

/**
 * Kinds of benefit a grant tag confers. `feat` is assignable-only; the five
 * proficiency kinds also drive floors.
 *
 * @typedef {'skill' | 'trade' | 'saving_throw' | 'armor' | 'weapon' | 'feat'} GrantCategory
 */
export type GrantCategory =
  | 'skill'
  | 'trade'
  | 'saving_throw'
  | 'armor'
  | 'weapon'
  | 'feat';

/**
 * A parsed grant tag, discriminated by target choice. `specific` grants are
 * auto-applied as floors; `oneOf` / `any` / `anyExcept` require player assignment.
 *
 * Tag grammar (`category:value[:tier][:count]`): `skill:arcana:expertise`
 * (specific), `skill:[arcana,history]:expertise` (oneOf), `skill:*:familiarity`
 * (all), `feat:any` (any), `feat:!ability-score-improvement` (anyExcept). A
 * trailing numeric segment sets the pick count (`skill:any:expertise:2`).
 *
 * @typedef {object} ParsedGrant
 * @property {'specific'|'all'|'oneOf'|'any'|'anyExcept'} kind - How the target is chosen
 * @property {GrantCategory} category - Benefit kind
 * @property {string} [value] - Target for `specific` (e.g. `persuasion`)
 * @property {string[]} [options] - Candidate targets for `oneOf`
 * @property {string[]} [deny] - Excluded targets for `anyExcept`
 * @property {number} [count] - Number of picks for a choice grant (default 1)
 * @property {TierLevel} tier - Granted tier; defaults to `proficient` when the tag omits it
 */
export type ParsedGrant =
  | { kind: 'specific'; category: GrantCategory; value: string; tier: TierLevel }
  | { kind: 'all'; category: GrantCategory; tier: TierLevel }
  | {
      kind: 'oneOf';
      category: GrantCategory;
      options: string[];
      tier: TierLevel;
      count: number;
    }
  | { kind: 'any'; category: GrantCategory; tier: TierLevel; count: number }
  | {
      kind: 'anyExcept';
      category: GrantCategory;
      deny: string[];
      tier: TierLevel;
      count: number;
    }
  | HpValueGrant;

/**
 * Derived proficiencies from a set of grant tags.
 *
 * @interface DerivedGrants
 * @property {Record<string, TierLevel>} skills - Skill value → highest granted tier
 * @property {Record<string, TierLevel>} trades - Trade/tool value → highest granted tier
 * @property {Partial<Record<AbilityKey, TierLevel>>} savingThrows - Save ability key → highest granted tier
 * @property {string[]} armor - Granted armor categories/items (lowercase values)
 * @property {string[]} weapons - Granted weapon categories/items (lowercase values)
 */
export interface DerivedGrants {
  skills: Record<string, TierLevel>;
  trades: Record<string, TierLevel>;
  savingThrows: Partial<Record<AbilityKey, TierLevel>>;
  armor: string[];
  weapons: string[];
}

const GRANT_CATEGORIES = new Set<string>([
  'skill',
  'trade',
  'saving_throw',
  'armor',
  'weapon',
  'feat',
]);

const GRANT_TIERS = new Set<string>([
  'familiarity',
  'proficient',
  'expertise',
  'savanthood',
]);

const ABILITY_ALIASES: Record<string, AbilityKey> = {
  strength: 'str',
  str: 'str',
  dexterity: 'dex',
  dex: 'dex',
  constitution: 'con',
  con: 'con',
  intelligence: 'int',
  int: 'int',
  wisdom: 'wis',
  wis: 'wis',
  charisma: 'cha',
  cha: 'cha',
};

/**
 * Splits a bracketed or bare comma list (`[a,b,c]` or `a`) into trimmed values.
 *
 * @function parseGrantList
 * @param {string} raw - List body, with or without surrounding brackets
 * @returns {string[]} Non-empty trimmed values
 */
function parseGrantList(raw: string): string[] {
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses a single grant tag into a discriminated {@link ParsedGrant}. `hp`
 * parses positionally (`hp:<term>:<scope>`); other categories use
 * `category:value[:tier][:count]`, where `value` selects the kind: `any`,
 * `!x`/`![x,y]` (anyExcept), `[a,b,c]` (oneOf), `*` (all), or a bare token
 * (specific).
 *
 * @function parseGrant
 * @param {string} tag - Raw grant tag
 * @returns {ParsedGrant | null} Parsed grant, or `null` when malformed/unknown category
 */
export function parseGrant(tag: string): ParsedGrant | null {
  const segs = tag.split(':').map((part) => part.trim().toLowerCase());
  if (segs[0] === 'hp') return parseHpGrant(segs);
  const parts = segs.filter(Boolean);
  if (parts.length < 2) return null;

  const [category, value, ...rest] = parts;
  if (!GRANT_CATEGORIES.has(category) || !value) return null;
  const cat = category as GrantCategory;
  let tier: TierLevel = 'proficient';
  let count = 1;
  for (const seg of rest) {
    if (GRANT_TIERS.has(seg)) tier = seg as TierLevel;
    else if (/^\d+$/.test(seg)) count = Math.max(1, parseInt(seg, 10));
  }

  if (value === 'any') return { kind: 'any', category: cat, tier, count };
  if (value === '*') return { kind: 'all', category: cat, tier };
  if (value.startsWith('!')) {
    const deny = parseGrantList(value.slice(1));
    return deny.length > 0
      ? { kind: 'anyExcept', category: cat, deny, tier, count }
      : null;
  }
  if (value.startsWith('[')) {
    const options = parseGrantList(value);
    return options.length > 0
      ? { kind: 'oneOf', category: cat, options, tier, count }
      : null;
  }
  return { kind: 'specific', category: cat, value, tier };
}

/**
 * Returns the higher of two proficiency tiers by {@link TIER_CYCLE} order.
 *
 * @function higherTier
 * @param {TierLevel} a - First tier
 * @param {TierLevel} b - Second tier
 * @returns {TierLevel} The higher tier
 */
export function higherTier(a: TierLevel, b: TierLevel): TierLevel {
  return TIER_CYCLE.indexOf(a) >= TIER_CYCLE.indexOf(b) ? a : b;
}

/**
 * Reduces grant tags to the proficiencies they confer: highest tier per
 * skill/trade/save, deduped armor/weapon grants. Only `specific` grants
 * contribute; choice grants (`oneOf` / `any` / `anyExcept`) are skipped.
 *
 * @function deriveGrants
 * @param {string[]} tags - Grant tags from one or more features
 * @returns {DerivedGrants} Derived proficiencies
 */
export function deriveGrants(tags: string[]): DerivedGrants {
  const skills: Record<string, TierLevel> = {};
  const trades: Record<string, TierLevel> = {};
  const savingThrows: Partial<Record<AbilityKey, TierLevel>> = {};
  const armor = new Set<string>();
  const weapons = new Set<string>();

  for (const tag of tags) {
    const grant = parseGrant(tag);
    if (!grant || grant.kind !== 'specific') continue;

    if (grant.category === 'skill') {
      skills[grant.value] = higherTier(skills[grant.value] ?? 'none', grant.tier);
    } else if (grant.category === 'trade') {
      trades[grant.value] = higherTier(trades[grant.value] ?? 'none', grant.tier);
    } else if (grant.category === 'saving_throw') {
      const key = ABILITY_ALIASES[grant.value];
      if (key) {
        savingThrows[key] = higherTier(savingThrows[key] ?? 'none', grant.tier);
      }
    } else if (grant.category === 'armor') {
      armor.add(grant.value);
    } else if (grant.category === 'weapon') {
      weapons.add(grant.value);
    }
  }

  return { skills, trades, savingThrows, armor: [...armor], weapons: [...weapons] };
}

/**
 * Collects every grant tag from a character's active features: vocation and
 * specialization shards unlocked at or below vocation level, plus selected
 * feats. Boons excluded.
 *
 * @function collectActiveGrants
 * @param {CharacterSheet} character - Character to inspect
 * @returns {string[]} All active grant tags (with duplicates preserved for the caller to reduce)
 */
export function collectActiveGrants(character: CharacterSheet): string[] {
  return collectActiveGrantShards(character).flatMap(
    (shard) => shard.grants ?? [],
  );
}

/**
 * Collects the grant-bearing shards of a character's active features and
 * selected feats: vocation and specialization feature shards unlocked at or
 * below vocation level, plus every selected feat. Preserves the shard (heading,
 * id, grants) so callers can attribute a grant to its source feature.
 *
 * @function collectActiveGrantShards
 * @param {CharacterSheet} character - Character to inspect
 * @returns {CharacterShard[]} Active grant-bearing shards
 */
export function collectActiveGrantShards(
  character: CharacterSheet,
): CharacterShard[] {
  const featureShards = character.vocations.flatMap((vocation) => [
    ...vocation.vocationFeatures.filter(
      (shard) => shard.level === undefined || shard.level <= vocation.level,
    ),
    ...vocation.specializationFeatures.filter(
      (shard) => shard.level === undefined || shard.level <= vocation.level,
    ),
  ]);
  return [...featureShards, ...(character.selectedFeats ?? [])];
}

/**
 * Derives the proficiencies a character's currently-active features confer.
 * Convenience wrapper over {@link collectActiveGrants} + {@link deriveGrants}.
 *
 * @function deriveActiveGrants
 * @param {CharacterSheet} character - Character to inspect
 * @returns {DerivedGrants} Proficiencies granted by active features and feats
 */
export function deriveActiveGrants(character: CharacterSheet): DerivedGrants {
  return deriveGrants(collectActiveGrants(character));
}

/**
 * Converts a kebab-case grant value to the camelCase suffix used by the i18n
 * proficiency keys (`sleight-of-hand` → `sleightOfHand`).
 *
 * @function kebabToCamel
 * @param {string} value - Kebab-case grant value
 * @returns {string} camelCase key suffix
 */
export function kebabToCamel(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Auto-apply floors keyed to match the editable tables. Skill and tool tiers are
 * keyed by their i18n name (`skills.persuasion`, `tools.smithing`); saving
 * throws stay keyed by ability.
 *
 * @interface GrantFloors
 * @property {Record<string, TierLevel>} skills - Skill i18n name → granted floor tier
 * @property {Record<string, TierLevel>} tools - Tool i18n name → granted floor tier (feature/feat trade grants plus the first/primary vocation's fixed base trades)
 * @property {Partial<Record<AbilityKey, TierLevel>>} savingThrows - Ability key → granted floor tier (feature/feat saving-throw grants plus the first/primary vocation's base saves)
 * @property {string[]} armor - Granted armor categories/items
 * @property {string[]} weapons - Granted weapon categories/items
 */
export interface GrantFloors {
  skills: Record<string, TierLevel>;
  tools: Record<string, TierLevel>;
  savingThrows: Partial<Record<AbilityKey, TierLevel>>;
  armor: string[];
  weapons: string[];
}

/**
 * Builds the {@link GrantFloors} a character confers, remapping skill/trade grant
 * values to i18n table names and folding the primary (`vocations[0]`) vocation's
 * base saves and fixed trades (`proficient`) into the floors. Only the primary
 * vocation grants base proficiencies. Reads `vocations[0]` live, so reordering/
 * removing it recalculates. `all` grants (`skill:*:familiarity`) floor every row
 * in their category at the tier.
 *
 * @function deriveGrantFloors
 * @param {CharacterSheet} character - Character to inspect
 * @returns {GrantFloors} Per-proficiency granted floors for auto-apply
 */
export function deriveGrantFloors(character: CharacterSheet): GrantFloors {
  const derived = deriveActiveGrants(character);
  const skills: Record<string, TierLevel> = {};
  for (const [value, tier] of Object.entries(derived.skills)) {
    skills[`skills.${kebabToCamel(value)}`] = tier;
  }
  const tools: Record<string, TierLevel> = {};
  for (const [value, tier] of Object.entries(derived.trades)) {
    tools[`tools.${kebabToCamel(value)}`] = tier;
  }
  const savingThrows: Partial<Record<AbilityKey, TierLevel>> = {
    ...derived.savingThrows,
  };
  const primaryVocation = character.vocations[0];
  for (const abilityName of primaryVocation?.baseSavingThrows ?? []) {
    const key = ABILITY_ALIASES[abilityName.trim().toLowerCase()];
    if (key) {
      savingThrows[key] = higherTier(savingThrows[key] ?? 'none', 'proficient');
    }
  }
  for (const toolKey of primaryVocation?.baseTradeFixed ?? []) {
    tools[toolKey] = higherTier(tools[toolKey] ?? 'none', 'proficient');
  }
  for (const tag of collectActiveGrants(character)) {
    const grant = parseGrant(tag);
    if (grant?.kind !== 'all') continue;
    if (grant.category === 'skill') {
      for (const item of character.skills) {
        skills[item.name] = higherTier(skills[item.name] ?? 'none', grant.tier);
      }
    } else if (grant.category === 'trade') {
      for (const item of character.tools) {
        tools[item.name] = higherTier(tools[item.name] ?? 'none', grant.tier);
      }
    }
  }
  return {
    skills,
    tools,
    savingThrows,
    armor: derived.armor,
    weapons: derived.weapons,
  };
}
