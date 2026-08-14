/**
 * @fileoverview Character Entity — canonical single-JSON character model.
 * @description One flat, self-contained JSON structure: plain objects and
 * arrays only, no class instances, no functions, no circular links.
 * Re-exported from `@/lib/types/character`.
 *
 * @module modules/character-builder/domain/character/characterEntity
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */
import type { HitDieRollEntry } from '@/lib/types/hitDice';

/**
 * Proficiency level for saves and skills.
 *
 * @typedef {'none'|'familiarity'|'proficient'|'expertise'|'savanthood'} TierLevel
 */
export type TierLevel =
  | 'none'
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood';

/**
 * Ability score keys — the six core stats, in canonical order.
 *
 * @type {readonly ['str', 'dex', 'con', 'int', 'wis', 'cha']}
 */
export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

/**
 * Ability score key union, derived from {@link ABILITY_KEYS}.
 *
 * @typedef {typeof ABILITY_KEYS[number]} AbilityKey
 */
export type AbilityKey = (typeof ABILITY_KEYS)[number];

/**
 * A named block of MDX content extracted from a source file, identified by
 * heading text and line range.
 *
 * @interface CharacterShard
 * @property {string} id - Unique shard identifier
 * @property {string} sourceFile - Relative path from `src/content/en/`, e.g. `character-creation/bloodlines/empyrean.bloodline.mdx`
 * @property {string} heading - The exact heading text, e.g. `Extended Reach`
 * @property {'boon'|'vocation-feature'|'specialization-feature'|'feat'} category - Type of content block
 * @property {number} [bpCost] - Boon Point cost (boons only)
 * @property {number} [level] - Minimum level required (vocation/specialization features only)
 * @property {string} [cachedText] - First-paragraph preview cached after first fetch
 * @property {string[]} [selectedSubOptions] - Chosen sub-option names for a variable-cost boon (boons only); their costs sum into `bpCost`
 * @property {string[]} [grants] - Tag-based proficiency grants this feature confers (e.g. `weapon:martial`, `skill:persuasion:expertise`)
 * @property {number} [startLine] - 1-indexed start line of this block in the source MDX file
 * @property {number} [endLine] - 1-indexed end line of this block in the source MDX file
 */
export interface CharacterShard {
  id: string;
  sourceFile: string;
  heading: string;
  category: 'boon' | 'vocation-feature' | 'specialization-feature' | 'feat';
  bpCost?: number;
  level?: number;
  cachedText?: string;
  selectedSubOptions?: string[];
  grants?: string[];
  startLine?: number;
  endLine?: number;
}

/**
 * Ability type discriminant for character abilities.
 *
 * @typedef {'Spell' | 'Feature' | 'Feat' | 'Heirloom' | 'Trinket' | 'Other'} AbilityType
 */
export type AbilityType =
  | 'Spell'
  | 'Feature'
  | 'Feat'
  | 'Heirloom'
  | 'Trinket'
  | 'Other';

/**
 * Provenance marker for imported abilities.
 *
 * @typedef {'spells' | 'heirlooms' | 'trinkets' | 'feats'} AbilityImportSource
 */
export type AbilityImportSource = 'spells' | 'heirlooms' | 'trinkets' | 'feats';

/**
 * A single ability card on the character's Abilities tab.
 * Stores raw MDX for mechanics and description, rendered client-side via
 * `compileRuntimeSync` + `enrichedComponents`.
 *
 * @interface CharacterAbility
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {AbilityType} type - Category discriminant
 * @property {string} mechanics - Raw MDX mechanics block (e.g. spell blockquote stats, custom text)
 * @property {string} description - Raw MDX description prose
 * @property {string} [rawSource] - Full raw MDX source fetched at import time; rendered on expand
 * @property {string} [source] - Slug of the source content item if imported
 * @property {AbilityImportSource | null} [importedFrom] - Metadata source if imported, null for manual entries
 */
export interface CharacterAbility {
  id: string;
  name: string;
  type: AbilityType;
  mechanics: string;
  description: string;
  rawSource?: string;
  source?: string;
  importedFrom?: AbilityImportSource | null;
}

/**
 * A single attack entry on a character sheet.
 *
 * @interface CharacterAttack
 * @property {string} id - Unique identifier
 * @property {string} name - Attack name, e.g. `Longsword`
 * @property {string} toHit - To-hit expression, e.g. `+7`
 * @property {string} damage - Damage expression, e.g. `1d8+4 slashing`
 * @property {string} notes - Free-text notes
 */
export interface CharacterAttack {
  id: string;
  name: string;
  toHit: string;
  damage: string;
  notes: string;
}

/**
 * A single spell slot level entry.
 *
 * @interface CharacterSpellSlot
 * @property {number} level - Spell level (1–9)
 * @property {number} total - Total slots at this level
 * @property {number} used - Slots used at this level
 */
export interface CharacterSpellSlot {
  level: number;
  total: number;
  used: number;
}

/**
 * A single skill entry with proficiency and linked ability.
 *
 * @interface CharacterSkill
 * @property {string} name - Skill name, e.g. `Acrobatics`
 * @property {AbilityKey} ability - Linked ability, e.g. `dex`
 * @property {TierLevel} tier - Current proficiency level
 */
export interface CharacterSkill {
  name: string;
  ability: AbilityKey;
  tier: TierLevel;
}

/**
 * A single tool entry with proficiency.
 *
 * @interface CharacterTool
 * @property {string} name - Tool name, e.g. `Thieves' Tools`
 * @property {TierLevel} tier - Current proficiency level
 */
export interface CharacterTool {
  name: string;
  tier: TierLevel;
}

/**
 * Currency carried by the character.
 *
 * @interface CharacterCurrency
 * @property {number} pp - Platinum pieces
 * @property {number} gp - Gold pieces
 * @property {number} ep - Electrum pieces
 * @property {number} sp - Silver pieces
 * @property {number} cp - Copper pieces
 */
export interface CharacterCurrency {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

/**
 * A single denomination within a currency system (e.g. "gold piece" inside the
 * `Gold Standard` system).
 *
 * @interface CoinDenomination
 * @property {string} name - Display name (e.g. `"Gold"` or `"Sovereigns"`)
 * @property {number} multiplier - Conversion factor expressed in system base units. The base unit is whatever has `multiplier === 1`.
 * @property {string} [abbreviation] - Optional short form (e.g. `"gp"`)
 */
export interface CoinDenomination {
  name: string;
  multiplier: number;
  abbreviation?: string;
}

/**
 * Definition of a coinage system. A character may carry holdings against many
 * systems simultaneously (campaign mixing). Built-in systems are immutable;
 * custom systems are user-defined.
 *
 * @interface CurrencySystem
 * @property {string} name - Unique system name (e.g. `"Gold Standard"`)
 * @property {number} exchangeRate - Conversion factor to a notional shared unit (`1.0` for the canonical system)
 * @property {CoinDenomination[]} coins - Ordered list of denominations
 * @property {boolean} [builtIn] - True for shipped systems that cannot be edited or removed
 */
export interface CurrencySystem {
  name: string;
  exchangeRate: number;
  coins: CoinDenomination[];
  builtIn?: boolean;
}

/**
 * Counts of each denomination held against a particular currency system.
 *
 * @interface CharacterCoinHoldings
 * @property {string} systemName - The `CurrencySystem.name` this holding belongs to
 * @property {Record<string, number>} counts - Map from denomination name to integer count
 */
export interface CharacterCoinHoldings {
  systemName: string;
  counts: Record<string, number>;
}

/**
 * Compact reference object encoded in the print QR code.
 * Intentionally small to stay under QR capacity limits (~1 KB).
 *
 * @interface CompactCharacterRef
 * @property {1} v - Schema version (always 1)
 * @property {string} n - Character name
 * @property {number} l - Level
 * @property {string} b - Bloodline slug
 * @property {string} vc - Vocation slug
 * @property {string} s - Specialization slug
 * @property {number[]} as - Ability scores [str, dex, con, int, wis, cha]
 * @property {number} hp - Max HP
 * @property {number} ac - Armor class
 * @property {string[]} boons - Selected boon heading names
 */
export interface CompactCharacterRef {
  v: 1;
  n: string;
  l: number;
  b: string;
  vc: string;
  s: string;
  as: number[];
  hp: number;
  ac: number;
  boons: string[];
}

/**
 * A single inventory entry on the equipment tab.
 *
 * @interface EquipmentItem
 * @property {string} id - Stable unique identifier
 * @property {string} name - Item name
 * @property {number} quantity - Number of units carried
 * @property {number} weightLb - Weight per unit in pounds
 */
export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weightLb: number;
}

/**
 * A single vocation entry in a character's vocation list.
 * Supports mixing (multiclassing) by allowing multiple entries, each with its
 * own level, specialization, and feature shards.
 *
 * @interface VocationEntry
 * @property {string} slug - Vocation identifier, e.g. `wizard`
 * @property {string} title - Display name, e.g. `Wizard`
 * @property {number} level - Levels invested in this vocation specifically
 * @property {number} [hitDie] - Hit die face count (e.g. `10`), copied from vocation metadata on selection. `0` when the vocation has no usable die.
 * @property {string[]} [baseSavingThrows] - Saving-throw ability names this vocation confers at its base (e.g. `["Constitution", "Intelligence"]`), copied from vocation metadata on selection and auto-applied as a proficiency floor
 * @property {number} [baseSkillChoiceCount] - Number of base skill proficiencies this vocation lets the player choose (from its metadata `skillProficiencies.count`), synced from vocation metadata; the primary vocation's value drives the unspent-proficiency counter
 * @property {string[]} [baseSkillChoices] - The skills this vocation offers as its base picks, stored as table row-keys (`skills.<camel>`). Empty with a non-zero `baseSkillChoiceCount` means "any skill" (unrestricted). Synced from vocation metadata `skillProficiencies.choices`; drives the per-row hint marker and the on-list budget
 * @property {string[]} [baseTradeFixed] - Trades this vocation grants outright (not chosen), stored as table row-keys (`tools.<camel>`). Synced from vocation metadata `toolProficiencies`; the primary vocation's list is folded into the tools floor
 * @property {string|null} specializationSlug - Specialization identifier, e.g. `evoker`
 * @property {string} specializationTitle - Specialization display name, e.g. `Evoker`
 * @property {CharacterShard[]} vocationFeatures - Unlocked vocation feature shards for this entry
 * @property {CharacterShard[]} specializationFeatures - Unlocked specialization feature shards for this entry
 */
export interface VocationEntry {
  slug: string;
  title: string;
  level: number;
  hitDie?: number;
  baseSavingThrows?: string[];
  baseSkillChoiceCount?: number;
  baseSkillChoices?: string[];
  baseTradeFixed?: string[];
  specializationSlug: string | null;
  specializationTitle: string;
  vocationFeatures: CharacterShard[];
  specializationFeatures: CharacterShard[];
}

/**
 * The canonical character entity: one flat JSON document per character,
 * stored verbatim in localStorage and across the persistence layer.
 *
 * Invariants:
 * - Serializable with `JSON.stringify` (round-trips losslessly)
 * - No self-referencing or circular structures
 * - `level` / `tierBonus` are derived caches recomputed by the sheet reducer
 *
 * @interface CharacterEntity
 * @property {string} id - Unique character identifier
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last save
 * @property {string} name - Character name
 * @property {string} playerName - Player's name
 * @property {number} level - Character level (1–30)
 * @property {number} experience - Experience points
 * @property {string|null} bloodlineSlug - Bloodline identifier, e.g. `empyrean`
 * @property {string} bloodlineTitle - Display name, e.g. `Empyrean`
 * @property {number} boonBudget - Total Boon Points available from bloodline
 * @property {CharacterShard[]} selectedBoons - Chosen boon shards
 * @property {VocationEntry[]} vocations - Vocation entries, each tracking its own level (mixing support)
 * @property {{ str: number; dex: number; con: number; int: number; wis: number; cha: number }} abilityScores - Six core ability scores
 * @property {number} hpMax - Maximum hit points
 * @property {number} hpCurrent - Current hit points
 * @property {number} tempHp - Temporary hit points
 * @property {number} [grievousWounds] - Grievous-wound pool; degrades the effective max HP (`base − grievousWounds`). Defaults to 0.
 * @property {number} ac - Armor class
 * @property {number} initiativeBonus - Initiative modifier (typically DEX mod)
 * @property {number|null} speedOverride - Override for movement speed (walk); null = no override
 * @property {string[]} bloodlineSpeeds - Raw speed strings from the selected bloodline
 * @property {number} tierBonus - Tier bonus, derived from level
 * @property {number} gritCurrent - Current grit points; spent to enhance rolls
 * @property {number} gritMax - Maximum grit points; manually set by player
 * @property {string[]} manualStatOverrides - Stat keys the player has pinned to manual values
 * @property {HitDieRollEntry[]} hitDiceLog - Per-level hit die roll history
 * @property {Record<string, number>} [spentHitDice] - Hit dice spent (healing / grievous-wound clearing) by vocation slug; recover ½ per Recovery
 * @property {Record<string, number>} [lostHitDice] - Hit dice lost to Misdeed overshoot by vocation slug; frozen until all grievous wounds clear, then 1 per Recovery
 * @property {string[]} conditions - Active condition labels
 * @property {CharacterAttack[]} attacks - Attack entries
 * @property {CharacterSpellSlot[]} spellSlots - Spell slot tracking (1–9)
 * @property {Record<AbilityKey, TierLevel>} savingThrows - Save proficiency per ability
 * @property {CharacterSkill[]} skills - Full skill list with proficiency
 * @property {CharacterTool[]} tools - Tool proficiency list
 * @property {string[]} [armorProficiencies] - Armor categories granted by active features (derived from grant tags)
 * @property {string[]} [weaponProficiencies] - Weapon categories/items granted by active features (derived from grant tags)
 * @property {EquipmentItem[]} equipment - Equipment items with name, quantity, and weight
 * @property {CharacterCurrency} currency - Carried currency
 * @property {string} wants - What the character wants
 * @property {string} fears - What the character fears
 * @property {string} virtues - Character virtues
 * @property {string} flaws - Character flaws
 * @property {string} bonds - Bonds
 * @property {string} notes - Miscellaneous notes
 * @property {CharacterAbility[]} abilities - Character abilities (spells, features, feats, etc.)
 */
export interface CharacterEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  playerName: string;
  level: number;
  experience: number;
  bloodlineSlug: string | null;
  bloodlineTitle: string;
  boonBudget: number;
  selectedBoons: CharacterShard[];
  vocations: VocationEntry[];
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hpMax: number;
  hpCurrent: number;
  tempHp: number;
  grievousWounds?: number;
  ac: number;
  initiativeBonus: number;
  speedOverride: number | null;
  bloodlineSpeeds: string[];
  tierBonus: number;
  gritCurrent: number;
  gritMax: number;
  manualStatOverrides: string[];
  hitDiceLog: HitDieRollEntry[];
  spentHitDice?: Record<string, number>;
  lostHitDice?: Record<string, number>;
  conditions: string[];
  attacks: CharacterAttack[];
  spellSlots: CharacterSpellSlot[];
  savingThrows: Record<AbilityKey, TierLevel>;
  skills: CharacterSkill[];
  tools: CharacterTool[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  equipment: EquipmentItem[];
  equipmentNotes: string;
  selectedFeats: CharacterShard[];
  currency: CharacterCurrency;
  coinHoldings: CharacterCoinHoldings[];
  wants: string;
  fears: string;
  virtues: string;
  flaws: string;
  bonds: string;
  notes: string;
  bibliographyNotes: string;
  abilities: CharacterAbility[];
}

/**
 * Back-compat alias — the entity was historically named `CharacterSheet`.
 *
 * @typedef {CharacterEntity} CharacterSheet
 */
export type CharacterSheet = CharacterEntity;

/**
 * Serialize an entity to its canonical JSON string form.
 *
 * @function serializeCharacterEntity
 * @param {CharacterEntity} entity - Entity to serialize
 * @returns {string} JSON string
 */
export const serializeCharacterEntity = (entity: CharacterEntity): string =>
  JSON.stringify(entity);

/**
 * Deep-clone an entity losslessly through its JSON form.
 *
 * @function cloneCharacterEntity
 * @param {CharacterEntity} entity - Entity to clone
 * @returns {CharacterEntity} Structurally independent copy
 */
export const cloneCharacterEntity = (
  entity: CharacterEntity,
): CharacterEntity => JSON.parse(JSON.stringify(entity)) as CharacterEntity;

/**
 * Loose structural guard for raw values read from storage or messages.
 * Checks the identity fields only — full normalization is handled by
 * `migrateCharacter` in `lib/utils/characterStorage`.
 *
 * @function isCharacterEntity
 * @param {unknown} value - Candidate value
 * @returns {value is CharacterEntity} True when the value looks like an entity
 */
export const isCharacterEntity = (value: unknown): value is CharacterEntity => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['id'] === 'string' && typeof v['name'] === 'string';
};
