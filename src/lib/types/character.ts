/**
 * @fileoverview Character Sheet Types
 * @description TypeScript interfaces for the player character sheet module.
 * Stores full character data in localStorage. Linked to party members in
 * the encounter planner via `characterId`. Separate from InProgressCombatant —
 * characters are the source of truth; combatants are runtime snapshots.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/lib/types/character
 */

/**
 * Proficiency level for saves and skills.
 *
 * @typedef {'none'|'familiarity'|'proficient'|'expertise'} ProficiencyLevel
 */
export type ProficiencyLevel =
  | 'none'
  | 'familiarity'
  | 'proficient'
  | 'expertise';

/**
 * Ability score keys — the six core stats.
 *
 * @typedef {'str'|'dex'|'con'|'int'|'wis'|'cha'} AbilityKey
 */
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/**
 * A shard extracted from an MDX source file — a named block of content
 * (a boon or a vocation/specialization feature) identified by heading name
 * and line range. Used to display the full text of a chosen feature without
 * duplicating content.
 *
 * @interface CharacterShard
 * @property {string} id - Unique shard identifier
 * @property {string} sourceFile - Relative path from `src/content/en/`, e.g. `character-creation/bloodlines/empyrean.bloodline.mdx`
 * @property {string} heading - The exact heading text, e.g. `Extended Reach`
 * @property {'boon'|'vocation-feature'|'specialization-feature'|'feat'} category - Type of content block
 * @property {number} [bpCost] - Boon Point cost (boons only)
 * @property {number} [level] - Minimum level required (vocation/specialization features only)
 * @property {string} [cachedText] - First-paragraph preview cached after first fetch
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
  startLine?: number;
  endLine?: number;
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
 * @property {ProficiencyLevel} proficiency - Current proficiency level
 */
export interface CharacterSkill {
  name: string;
  ability: AbilityKey;
  proficiency: ProficiencyLevel;
}

/**
 * A single tool entry with proficiency.
 *
 * @interface CharacterTool
 * @property {string} name - Tool name, e.g. `Thieves' Tools`
 * @property {ProficiencyLevel} proficiency - Current proficiency level
 */
export interface CharacterTool {
  name: string;
  proficiency: ProficiencyLevel;
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
 * `5e Standard` system).
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
 * @property {string} name - Unique system name (e.g. `"5e Standard"`)
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
 * Full Damocles character sheet stored in localStorage.
 * This is the canonical data model — all other representations (combatants,
 * compact refs, print output) are derived from this.
 *
 * @interface CharacterSheet
 * @property {string} id - Unique character identifier
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last save
 * @property {string} name - Character name
 * @property {string} playerName - Player's name
 * @property {number} level - Character level (1–20)
 * @property {number} experience - Experience points
 * @property {string|null} bloodlineSlug - Bloodline identifier, e.g. `empyrean`
 * @property {string} bloodlineTitle - Display name, e.g. `Empyrean`
 * @property {number} boonBudget - Total Boon Points available from bloodline
 * @property {CharacterShard[]} selectedBoons - Chosen boon shards
 * @property {string|null} vocationSlug - Vocation identifier, e.g. `wizard`
 * @property {string} vocationTitle - Display name, e.g. `Wizard`
 * @property {string|null} specializationSlug - Specialization identifier, e.g. `evoker`
 * @property {string} specializationTitle - Display name, e.g. `Evoker`
 * @property {CharacterShard[]} vocationFeatures - Unlocked vocation feature shards
 * @property {CharacterShard[]} specializationFeatures - Unlocked specialization feature shards
 * @property {{ str: number; dex: number; con: number; int: number; wis: number; cha: number }} abilityScores - Six core ability scores
 * @property {number} hpMax - Maximum hit points
 * @property {number} hpCurrent - Current hit points
 * @property {number} tempHp - Temporary hit points
 * @property {number} ac - Armor class
 * @property {number} initiativeBonus - Initiative modifier (typically DEX mod)
 * @property {number|null} speedOverride - Override for movement speed; null = use bloodline default
 * @property {number} proficiencyBonus - Proficiency bonus, derived from level
 * @property {string[]} conditions - Active condition labels
 * @property {CharacterAttack[]} attacks - Attack entries
 * @property {CharacterSpellSlot[]} spellSlots - Spell slot tracking (1–9)
 * @property {Record<AbilityKey, ProficiencyLevel>} savingThrows - Save proficiency per ability
 * @property {CharacterSkill[]} skills - Full skill list with proficiency
 * @property {CharacterTool[]} tools - Tool proficiency list
 * @property {string[]} equipment - Equipment list as free-text entries
 * @property {CharacterCurrency} currency - Carried currency
 * @property {string} background - Background narrative
 * @property {string} personality - Personality traits
 * @property {string} ideals - Ideals
 * @property {string} bonds - Bonds
 * @property {string} flaws - Flaws
 * @property {string} notes - Miscellaneous notes
 */
export interface CharacterSheet {
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
  vocationSlug: string | null;
  vocationTitle: string;
  specializationSlug: string | null;
  specializationTitle: string;
  vocationFeatures: CharacterShard[];
  specializationFeatures: CharacterShard[];
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
  ac: number;
  initiativeBonus: number;
  speedOverride: number | null;
  proficiencyBonus: number;
  conditions: string[];
  attacks: CharacterAttack[];
  spellSlots: CharacterSpellSlot[];
  savingThrows: Record<AbilityKey, ProficiencyLevel>;
  skills: CharacterSkill[];
  tools: CharacterTool[];
  equipment: string[];
  equipmentNotes: string;
  selectedFeats: CharacterShard[];
  currency: CharacterCurrency;
  coinHoldings: CharacterCoinHoldings[];
  background: string;
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
  notes: string;
}
