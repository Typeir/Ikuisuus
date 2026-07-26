/**
 * @fileoverview Vocation Metadata Types
 * @description TypeScript interfaces for vocation, specialization, and bloodline
 * metadata as returned by the `/api/bloodlines`, `/api/vocations`, and
 * `/api/specializations` endpoints. Also contains the shared `FeatureEntry`
 * shape used by metadata generators and character-sheet components.
 *
 * @module src/lib/types/vocations
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * A single level–name feature pair sourced from vocation or specialization
 * metadata. Used both during metadata generation and at runtime when assembling
 * {@link CharacterShard} arrays.
 *
 * @interface FeatureEntry
 * @property {number} level - Character level at which the feature is gained
 * @property {string} name - Feature display name
 * @property {number} [startLine] - 1-indexed start line of this feature's heading block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of this feature's heading block in the source MDX
 * @property {string[]} [grants] - Tag-based proficiency grants this feature confers
 */
export interface FeatureEntry {
  level: number;
  name: string;
  startLine?: number;
  endLine?: number;
  grants?: string[];
}

/**
 * Bloodline entry as returned by `/api/bloodlines`.
 *
 * @interface BloodlineOption
 * @property {string} slug - Bloodline identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path
 * @property {number} [boonBudget] - Total boon point budget
 * @property {{ movementSpeeds?: string[] }} [coreFeatures] - Core racial features; `movementSpeeds` is an array of strings like `"Walk: 30 ft."`
 */
export interface BloodlineOption {
  slug: string;
  title: string;
  file: string;
  boonBudget?: number;
  coreFeatures?: {
    movementSpeeds?: string[];
  };
}

/**
 * Vocation entry as returned by `/api/vocations`.
 *
 * @interface VocationOption
 * @property {string} slug - Vocation identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path (e.g. `src/content/en/character-creation/vocations/warlock/main.mdx`)
 * @property {FeatureEntry[]} features - Level–feature progression
 * @property {number} [hitDie] - Hit die face count (e.g. `10` for d10); present when returned by the metadata API
 * @property {string[]} [savingThrows] - Saving throw proficiencies (full ability names); present when the API returns full metadata
 * @property {string[]} [armorProficiencies] - Armor proficiency list
 * @property {string[]} [weaponProficiencies] - Weapon proficiency list
 * @property {string[]} [toolProficiencies] - Tool proficiency list
 * @property {{ count: number, choices: string[] }} [skillProficiencies] - Skill choice structure: number to pick from the choices list
 */
export interface VocationOption {
  slug: string;
  title: string;
  file: string;
  hitDie?: number;
  features: FeatureEntry[];
  savingThrows?: string[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  toolProficiencies?: string[];
  skillProficiencies?: { count: number; choices: string[] };
}

/**
 * Specialization entry as returned by `/api/specializations`.
 *
 * @interface SpecOption
 * @property {string} slug - Specialization identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path (e.g. `src/content/en/character-creation/vocations/warlock/pact-of-the-tome.specialization.mdx`)
 * @property {string} vocation - Parent vocation slug
 * @property {FeatureEntry[]} features - Level–feature list
 */
export interface SpecOption {
  slug: string;
  title: string;
  file: string;
  vocation: string;
  features: FeatureEntry[];
}
