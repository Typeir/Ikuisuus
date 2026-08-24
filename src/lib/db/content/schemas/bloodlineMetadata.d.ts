/**
 * @fileoverview Bloodline metadata domain schema.
 * @description Canonical types for bloodline metadata from generators.
 *
 * @module lib/db/content/schemas/bloodlineMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BaseMetadata } from './baseMetadata';

/**
 * A selectable option within a variable-cost boon (e.g. Silent One's Frame
 * sizes, Edaphite's Mind talents). Parsed from the boon's Cost-column table or
 * its nested option headings.
 *
 * @interface BloodlineBoonSubOption
 * @property {string} name - Option display name (e.g. "Powerful Build")
 * @property {number} bpValue - BP cost of this specific option
 * @property {string} [effect] - Short effect summary from the non-name/non-cost table columns
 * @property {string} [anchor] - Anchor slug of the rendered heading; the stable shard key
 */
export interface BloodlineBoonSubOption {
  name: string;
  bpValue: number;
  effect?: string;
  tags?: string[];
  anchor?: string;
}

/**
 * Individual boon option parsed from a Collapsible block.
 *
 * @interface BloodlineBoon
 * @property {string} name - Boon display name (e.g. "Extended Reach")
 * @property {string} bpLabel - Raw BP cost text (e.g. "6 BP", "Variable BP - Choose One")
 * @property {number} [bpValue] - Parsed numeric BP cost when deterministic; absent for variable-cost boons
 * @property {BloodlineBoonSubOption[]} [subOptions] - Selectable options for a variable-cost boon; each carries its own BP cost
 * @property {'choose-one' | 'pick-any'} [subOptionMode] - Whether the player picks exactly one sub-option or any number
 * @property {number} sortOrder - Zero-based position within the boon list
 * @property {number} [startLine] - 1-indexed start line of the boon heading block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of the boon content block in the source MDX
 * @property {string} [parentName] - Parent boon when this option is written as its own heading
 * @property {string} [anchor] - Anchor slug of the rendered heading; the stable shard key
 */
export interface BloodlineBoon {
  name: string;
  bpLabel: string;
  bpValue?: number;
  subOptions?: BloodlineBoonSubOption[];
  subOptionMode?: 'choose-one' | 'pick-any';
  sortOrder: number;
  startLine?: number;
  endLine?: number;
  tags: string[];
  parentName?: string;
  anchor?: string;
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
 * @property {BloodlineCoreFeatures} coreFeatures - Shared ancestry features
 * @property {number} [boonBudget] - Total boon point budget
 * @property {BloodlineBoon[]} boons - Ordered list of boon metadata
 * @property {BloodlineFeature[]} [features] - Core-feature traits with their own aspects
 */
/**
 * A core-feature trait of a bloodline.
 *
 * @property {string} id - `${slug}:${anchor}`
 * @property {string} name - Heading text
 * @property {{ start: number; end: number }} [source] - 0-based line range
 * @property {string} [anchor] - Anchor slug of the rendered heading; the stable shard key
 */
export interface BloodlineFeature {
  id: string;
  name: string;
  anchor?: string;
  tags: string[];
  source?: { start: number; end: number };
}

export interface BloodlineMetadata extends BaseMetadata {
  coreFeatures: BloodlineCoreFeatures;
  boonBudget?: number;
  boons: BloodlineBoon[];
  features?: BloodlineFeature[];
  indexVersion?: number;
}

/**
 * Lightweight projection for table and dropdown display.
 *
 * @interface BloodlineIndexEntry
 * @property {string[]} [size] - Available sizes
 * @property {string[]} [creatureTypes] - Creature classifications
 */
export interface BloodlineIndexEntry {
  slug: string;
  title: string;
  size?: string[];
  creatureTypes?: string[];
}
