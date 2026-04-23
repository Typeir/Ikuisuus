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
 * Movement speed modes.
 *
 * @property {string} raw - Original speed text
 * @property {Object} modes - Parsed movement modes with distances in feet
 */
export interface MonsterSpeed {
  raw: string;
  modes: {
    walk?: number;
    fly?: number;
    climb?: number;
    swim?: number;
    burrow?: number;
    hover?: boolean;
  };
}

/**
 * Single ability score entry.
 * The modifier is not stored — it is always computed: `floor((score - 10) / 2)`.
 *
 * @property {number} [score] - Ability score (3–30)
 */
export interface AbilityScore {
  score?: number;
}

/**
 * Full set of D&D ability scores.
 *
 * @interface AbilityScores
 * @property {AbilityScore} str - Strength ability score entry
 * @property {AbilityScore} dex - Dexterity ability score entry
 * @property {AbilityScore} con - Constitution ability score entry
 * @property {AbilityScore} int - Intelligence ability score entry
 * @property {AbilityScore} wis - Wisdom ability score entry
 * @property {AbilityScore} cha - Charisma ability score entry
 */
export interface AbilityScores {
  str: AbilityScore;
  dex: AbilityScore;
  con: AbilityScore;
  int: AbilityScore;
  wis: AbilityScore;
  cha: AbilityScore;
}

/**
 * Parsed senses entry.
 *
 * @property {string} raw - Original senses text
 * @property {number} [passivePerception] - Passive Perception score
 * @property {number} [darkvision] - Darkvision range in feet
 * @property {number} [blindsight] - Blindsight range in feet
 * @property {number} [tremorsense] - Tremorsense range in feet
 * @property {number} [truesight] - Truesight range in feet
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
 * @property {AbilityScores} [abilities] - Ability Scores (STR, DEX, CON, INT, WIS, CHA)
 * @property {Record<string, number>} [savingThrows] - Saving throw bonuses keyed by ability abbreviation
 * @property {string[]} [skills] - Skill proficiencies (e.g. ["Perception +5", "Stealth +7"])
 * @property {string[]} [damageResistances] - Damage resistances
 * @property {string[]} [damageImmunities] - Damage immunities
 * @property {string[]} [damageVulnerabilities] - Damage vulnerabilities
 * @property {string[]} [conditionImmunities] - Condition immunities
 * @property {MonsterSenses} [senses] - Senses
 * @property {string[]} [languages] - Known languages
 * @property {string} [cr] - Challenge rating (fractional or whole, e.g. "1/4", "10")
 * @property {number} [proficiencyBonus] - Proficiency bonus
 * @property {string[]} [tags] - Gameplay tags for filtering and search
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
  abilities?: AbilityScores;
  savingThrows?: Record<string, number>;
  skills?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: MonsterSenses;
  languages?: string[];
  cr?: string;
  proficiencyBonus?: number;
  tags?: string[];
  image?: string;
  description?: string;
  indexVersion?: number;
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
