/**
 * @fileoverview Monster Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateMonsterMetadata.ts`. Every field corresponds to a
 * parsed property emitted by `parseStatBlockSection()`.
 *
 * Monsters are unique because a single `.sheet.mdx` file may contain multiple
 * stat blocks (e.g., a dragon and its lair variant). Each stat block produces
 * one `MonsterMetadata` record. Multi-stat-block files use `subSlug` to
 * differentiate variants while sharing the same `slug` (filename base).
 *
 * @module lib/db/content/schemas/monsterMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Armor class parsed from stat block table.
 *
 * @property {number} value - Numeric AC value (e.g. 18)
 * @property {string} [notes] - AC source (e.g. "natural armor", "plate mail")
 * @property {string} [raw] - Original text from table cell
 */
export interface MonsterAC {
  value: number;
  notes?: string;
  raw?: string;
}

/**
 * Hit points parsed from stat block table.
 *
 * @property {number} average - Average HP (e.g. 168)
 * @property {string} [formula] - Dice formula (e.g. "16d12+80")
 * @property {string} [raw] - Original text from table cell
 */
export interface MonsterHP {
  average: number;
  formula?: string;
  raw?: string;
}

/**
 * Movement speed parsed from the stat block speed row.
 * All distances are in strides, the native Damocles unit. Consumers needing imperial convert at their own boundary; see the Foundry transformer. Matches `MonsterSpeedEmbed` property names.
 *
 * @property {string} raw - Original speed text
 * @property {number} [walk] - Walk speed in strides
 * @property {number} [fly] - Fly speed in strides
 * @property {number} [climb] - Climb speed in strides
 * @property {number} [swim] - Swim speed in strides
 * @property {number} [burrow] - Burrow speed in strides
 * @property {boolean} [hover] - Whether the creature hovers while flying
 */
export interface MonsterSpeed {
  raw: string;
  walk?: number;
  fly?: number;
  climb?: number;
  swim?: number;
  burrow?: number;
  hover?: boolean;
}

/**
 * Flat ability score set matching `MonsterScoreEmbed` property names.
 * Modifiers are not stored — always derived as `floor((score - 10) / 2)`.
 *
 * @interface MonsterScores
 * @property {number} [str] - Strength score (3–30)
 * @property {number} [dex] - Dexterity score (3–30)
 * @property {number} [con] - Constitution score (3–30)
 * @property {number} [int] - Intelligence score (3–30)
 * @property {number} [wis] - Wisdom score (3–30)
 * @property {number} [cha] - Charisma score (3–30)
 */
export interface MonsterScores {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

/**
 * Flat saving throw bonus set matching `MonsterSaveEmbed` property names.
 *
 * @interface MonsterSaves
 * @property {number} [str] - Strength saving throw bonus
 * @property {number} [dex] - Dexterity saving throw bonus
 * @property {number} [con] - Constitution saving throw bonus
 * @property {number} [int] - Intelligence saving throw bonus
 * @property {number} [wis] - Wisdom saving throw bonus
 * @property {number} [cha] - Charisma saving throw bonus
 */
export interface MonsterSaves {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

/**
 * Parsed senses entry.
 *
 * @property {string} raw - Original senses text
 * @property {number} [passivePerception] - Passive Perception score
 * @property {number} [darkvision] - Darkvision range in strides
 * @property {number} [blindsight] - Blindsight range in strides
 * @property {number} [tremorsense] - Tremorsense range in strides
 * @property {number} [truesight] - Truesight range in strides
 */
export interface MonsterSenses {
  raw: string;
  passivePerception?: number;
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  [key: string]: string | number | undefined;
}

/**
 * Complete monster metadata record as emitted by the generator.
 *
 * Derived from `parseStatBlockSection()` output in
 * `scripts/metadata/generateMonsterMetadata.ts`.
 *
 * @interface MonsterMetadata
 * @property {string} slug - URL-friendly filename base (e.g. "abominable-avian")
 * @property {string} [subSlug] - Variant identifier for multi-stat-block files (e.g. "albedo", "petal")
 * @property {string} title - Display name
 * @property {string} file - Relative file path (e.g. "src/content/en/monsters/abominable-avian.sheet.mdx")
 * @property {string} link - Wiki link path (e.g. "/library/monsters/abominable-avian")
 * @property {string} [size] - Creature size (lowercase: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan")
 * @property {string} [creatureType] - Creature type (lowercase: "aberration" | "beast" | "dragon" etc.)
 * @property {string} [alignment] - Alignment (lowercase: "chaotic evil" | "neutral" etc.)
 * @property {MonsterAC} [ac] - Armor Class
 * @property {MonsterHP} [hp] - Hit Points
 * @property {MonsterSpeed} [speed] - Movement Speed
 * @property {MonsterScores} [scores] - Flat ability scores matching MonsterScoreEmbed
 * @property {MonsterSaves} [saves] - Flat saving throw bonuses matching MonsterSaveEmbed
 * @property {string[]} [skills] - Skill proficiencies (e.g. ["Perception +5", "Stealth +7"])
 * @property {string[]} [damageResistances] - Damage resistances
 * @property {string[]} [damageImmunities] - Damage immunities
 * @property {string[]} [damageVulnerabilities] - Damage vulnerabilities
 * @property {string[]} [conditionImmunities] - Condition immunities
 * @property {MonsterSenses} [senses] - Senses
 * @property {string[]} [languages] - Known languages
 * @property {string} [cr] - Challenge rating (fractional or whole, e.g. "1/4", "10")
 * @property {number} [tierBonus] - Tier bonus
 * @property {string[]} [tags] - Gameplay tags for filtering and search
 * @property {MonsterFeatureSummary[]} [features] - Extracted feature shards, each with its own aspects
 * @property {string} [image] - Image path extracted from BlendedImage in MDX (e.g. "/library/images/Albedo.webp")
 * @property {string} [description] - Short prose lore description extracted from the stat block MDX
 * @property {number} [indexVersion] - Metadata format version
 */
export interface MonsterMetadata {
  slug: string;
  subSlug?: string;
  title: string;
  file: string;
  link: string;
  size?: string;
  creatureType?: string;
  alignment?: string;
  ac?: MonsterAC;
  hp?: MonsterHP;
  speed?: MonsterSpeed;
  scores?: MonsterScores;
  saves?: MonsterSaves;
  skills?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: MonsterSenses;
  languages?: string[];
  cr?: string;
  tierBonus?: number;
  tags?: string[];
  features?: MonsterFeatureSummary[];
  image?: string;
  description?: string;
  indexVersion?: number;
}

/**
 * The parts of an extracted feature shard the presentation layer reads.
 *
 * Aspects are derived per feature as well as per stat block, because "does this
 * creature deal force damage anywhere" is the wrong grain for the question a
 * reader has — the useful fact is which feature does it.
 *
 * @interface MonsterFeatureSummary
 * @property {string} id - Stable feature identifier, e.g. `mucklord/garbage-communion`
 * @property {string} name - Feature name as written in the stat block
 * @property {string} [trigger] - `passive`, `action` or `reaction`
 * @property {string[]} [tags] - Aspects derived from this feature alone
 */
export interface MonsterFeatureSummary {
  id: string;
  name: string;
  trigger?: string;
  tags?: string[];
}

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/monsters/index`.
 *
 * @interface MonsterIndexEntry
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} [cr] - Challenge rating
 * @property {string} [size] - Creature size
 * @property {string} [creatureType] - Creature type
 */
export interface MonsterIndexEntry {
  slug: string;
  title: string;
  cr?: string;
  size?: string;
  creatureType?: string;
}
