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

/* ──────────────────────  Nested Value Objects  ────────────────────── */

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

/* ────────────────────────  Root Entity  ────────────────────────────── */

/**
 * Complete monster metadata record as emitted by the generator.
 *
 * Derived from `parseStatBlockSection()` output in
 * `scripts/metadata/generateMonsterMetadata.ts`.
 */
export interface MonsterMetadata {
  /** URL-friendly filename base (e.g. "abominable-avian") */
  slug: string;
  /** Variant identifier for multi-stat-block files (e.g. "albedo", "petal") */
  subSlug?: string;
  /** Display name */
  title: string;
  /** Relative file path (e.g. "src/content/en/monsters/abominable-avian.sheet.mdx") */
  file: string;
  /** Wiki link path (e.g. "/library/monsters/abominable-avian") */
  link: string;
  /** Creature size (lowercase: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan") */
  size?: string;
  /** Creature type (lowercase: "aberration" | "beast" | "dragon" etc.) */
  creatureType?: string;
  /** Alignment (lowercase: "chaotic evil" | "neutral" etc.) */
  alignment?: string;
  /** Armor Class */
  ac?: MonsterAC;
  /** Hit Points */
  hp?: MonsterHP;
  /** Movement Speed */
  speed?: MonsterSpeed;
  /** Ability Scores (STR, DEX, CON, INT, WIS, CHA) */
  abilities?: AbilityScores;
  /** Saving throw bonuses keyed by ability abbreviation */
  savingThrows?: Record<string, number>;
  /** Skill proficiencies (e.g. ["Perception +5", "Stealth +7"]) */
  skills?: string[];
  /** Damage resistances */
  damageResistances?: string[];
  /** Damage immunities */
  damageImmunities?: string[];
  /** Damage vulnerabilities */
  damageVulnerabilities?: string[];
  /** Condition immunities */
  conditionImmunities?: string[];
  /** Senses */
  senses?: MonsterSenses;
  /** Known languages */
  languages?: string[];
  /** Challenge rating (fractional or whole, e.g. "1/4", "10") */
  cr?: string;
  /** Proficiency bonus */
  proficiencyBonus?: number;
  /** Gameplay tags for filtering and search */
  tags?: string[];
  /** Metadata format version */
  indexVersion?: number;
}

/* ──────────────────────  Index Projection  ─────────────────────────── */

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/monsters/index`.
 */
export interface MonsterIndexEntry {
  slug: string;
  title: string;
  cr?: string;
  size?: string;
  creatureType?: string;
}
