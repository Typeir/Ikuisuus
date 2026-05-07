/**
 * @fileoverview Bloodline Metadata Domain Schema
 * @description Canonical TypeScript types for bloodline metadata generated from
 * `scripts/metadata/generateBloodlineMetadata.ts`.
 *
 * Each bloodline record includes core features and an ordered list of boon options.
 * Boon records intentionally store only queryable fields and derived tags. Prose
 * remains in MDX content and is not duplicated in metadata.
 *
 * @module lib/db/content/schemas/bloodlineMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

/**
 * Individual boon option parsed from a Collapsible block.
 *
 * @property {string} name - Boon display name (e.g. "Extended Reach")
 * @property {string} bpLabel - Raw BP cost text (e.g. "6 BP", "Variable BP - Choose One")
 * @property {number} [bpValue] - Parsed numeric BP cost when deterministic; absent for variable-cost boons
 * @property {number} sortOrder - Zero-based position within the boon list
 * @property {number} [startLine] - 1-indexed start line of the boon heading block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of the boon content block in the source MDX
 * @property {string[]} tags - Derived gameplay tags for filtering/searching boon behavior
 */
export interface BloodlineBoon {
  name: string;
  bpLabel: string;
  bpValue?: number;
  sortOrder: number;
  startLine?: number;
  endLine?: number;
  tags: string[];
}

/**
 * Core features shared by all members of a bloodline.
 *
 * @interface BloodlineCoreFeatures
 * @property {string[]} abilityScores - Ability score bonuses (e.g. ["DEX +2", "CHA +1"])
 * @property {string[]} movementSpeeds - Movement modes (e.g. ["Walk: 30 ft."])
 * @property {string[]} senses - Sensory capabilities (e.g. ["Darkvision 30 ft."])
 * @property {string[]} size - Available sizes (e.g. ["Medium"])
 * @property {string[]} creatureTypes - Creature type classifications (e.g. ["Humanoid"])
 * @property {string} [age] - Lifespan description
 */
export interface BloodlineCoreFeatures {
  abilityScores: string[];
  movementSpeeds: string[];
  senses: string[];
  size: string[];
  creatureTypes: string[];
  age?: string;
}

/**
 * Complete bloodline metadata record as emitted by the generator.
 *
 * @interface BloodlineMetadata
 * @property {string} slug - URL-friendly identifier (e.g. "empyrean")
 * @property {string} title - Display name (e.g. "Empyrean")
 * @property {string} file - Relative file path
 * @property {string} link - Public route path
 * @property {string} [description] - Introductory lore text
 * @property {BloodlineCoreFeatures} coreFeatures - Shared ancestry features
 * @property {number} [boonBudget] - Total boon point budget
 * @property {BloodlineBoon[]} boons - Ordered list of boon metadata
 * @property {string[]} [tags] - Root-level bloodline tags
 * @property {number} [indexVersion] - Metadata schema/index version
 */
export interface BloodlineMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  description?: string;
  coreFeatures: BloodlineCoreFeatures;
  boonBudget?: number;
  boons: BloodlineBoon[];
  tags?: string[];
  indexVersion?: number;
}

/**
 * Lightweight projection for table and dropdown display.
 *
 * @interface BloodlineIndexEntry
 * @property {string} slug - Bloodline slug
 * @property {string} title - Bloodline title
 * @property {string[]} [size] - Available sizes
 * @property {string[]} [creatureTypes] - Creature classifications
 */
export interface BloodlineIndexEntry {
  slug: string;
  title: string;
  size?: string[];
  creatureTypes?: string[];
}
