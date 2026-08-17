/**
 * @fileoverview Vocation Metadata Domain Schema
 * @description Canonical TypeScript types for vocation metadata generated from
 * `scripts/metadata/generateVocationMetadata.ts`.
 *
 * Each vocation record captures the core traits table, feature progression,
 * proficiency grants, and optional spellcasting summary. A lightweight index
 * entry projection is also provided for table display.
 *
 * @module lib/db/content/schemas/vocationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * A single feature row from the vocation features table.
 *
 * @property {number} level - Character level at which the feature is gained
 * @property {string} name - Feature display name
 * @property {number} [startLine] - 1-indexed start line of the feature heading block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of the feature heading block in the source MDX
 * @property {string[]} [grants] - Tag-based proficiency grants this feature confers
 * @property {string} [heading] - Raw heading text the feature renders under (`1st Level – Spellcasting`)
 * @property {string[]} [tags] - Aspects extracted from the feature body
 * @property {string} [anchor] - Anchor slug of the rendered heading; the stable shard key
 */
export interface VocationFeature {
  level: number;
  name: string;
  anchor?: string;
  heading?: string;
  tags?: string[];
  startLine?: number;
  endLine?: number;
  grants?: string[];
}

/**
 * Spellcasting summary extracted from the vocation's spellcasting section.
 *
 * @property {string} ability - Primary spellcasting ability (e.g. "Charisma")
 * @property {string} progression - Caster classification ("Full" | "Half" | "Third" | "Pact")
 */
export interface VocationSpellcasting {
  ability: string;
  progression: string;
}

/**
 * Skill proficiency grant structure.
 *
 * @property {number} count - Number of skills to choose
 * @property {string[]} choices - Available skill options
 */
export interface VocationSkillProficiencies {
  count: number;
  choices: string[];
}

/**
 * Complete vocation metadata record as emitted by the generator.
 *
 * @interface VocationMetadata
 * @property {string} slug - URL-friendly identifier (e.g. "Berserker")
 * @property {string} title - Display name (e.g. "Berserker")
 * @property {string} file - Relative file path from content root
 * @property {string} link - Public route path
 * @property {string} archetype - Vocation archetype (e.g. "Martial", "Full Caster")
 * @property {string[]} primaryAbility - Primary ability scores (e.g. ["Strength"])
 * @property {number} hitDie - Hit die face count (e.g. 12 for a d12); 0 when the vocation declares none
 * @property {string[]} savingThrows - Saving throw proficiencies (e.g. ["Strength", "Constitution"])
 * @property {string[]} armorProficiencies - Armor proficiency list
 * @property {string[]} weaponProficiencies - Weapon proficiency list
 * @property {string[]} toolProficiencies - Tool proficiency list
 * @property {VocationSkillProficiencies} skillProficiencies - Skill choice structure
 * @property {VocationSpellcasting} [spellcasting] - Spellcasting summary if applicable
 * @property {string[]} specializations - Slugs of available specializations
 * @property {VocationFeature[]} features - Level-feature progression
 * @property {string[]} tags - Derived gameplay tags for filtering
 * @property {string} [description] - Prose description extracted from the vocation MDX
 * @property {number} [indexVersion] - Metadata schema version
 */
export interface VocationMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  archetype: string;
  primaryAbility: string[];
  hitDie: number;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillProficiencies: VocationSkillProficiencies;
  spellcasting?: VocationSpellcasting;
  specializations: string[];
  features: VocationFeature[];
  tags: string[];
  description?: string;
  indexVersion?: number;
}

/**
 * Lightweight projection for table and dropdown display.
 *
 * @interface VocationIndexEntry
 * @property {string} slug - Vocation slug
 * @property {string} title - Vocation title
 * @property {number} hitDie - Hit die face count
 * @property {string} archetype - Vocation archetype
 * @property {string[]} primaryAbility - Primary ability scores
 */
export interface VocationIndexEntry {
  slug: string;
  title: string;
  hitDie: number;
  archetype: string;
  primaryAbility: string[];
}
