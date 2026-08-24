/**
 * @fileoverview Specialization metadata domain schema.
 * @description Canonical types for specialization metadata from generators.
 *
 * @module lib/db/content/schemas/specializationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { BaseMetadata } from './baseMetadata';

/**
 * A single feature gained at a specific level.
 *
 * @property {number} level - Character level at which the feature is gained
 * @property {string} name - Feature display name
 * @property {number} [startLine] - 1-indexed start line of the feature heading block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of the feature heading block in the source MDX
 * @property {string[]} [grants] - Tag-based proficiency grants this feature confers
 * @property {string} [heading] - Raw heading text the feature renders under
 * @property {string} [anchor] - Anchor slug of the rendered heading; the stable shard key
 */
export interface SpecializationFeature {
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
 * An always-prepared spell entry tied to a class level.
 *
 * @property {number} level - Class level at which the spells become prepared
 * @property {string[]} spells - Spell names always prepared at this level
 */
export interface AlwaysPreparedSpells {
  level: number;
  spells: string[];
}

/**
 * Spellcasting details for third-caster subclasses (e.g. Eldritch Knight, Arcane Trickster).
 *
 * @property {string} ability - Spellcasting ability (e.g. "Intelligence")
 * @property {string} progression - Caster classification (typically "Third")
 */
export interface SpecializationSpellcasting {
  ability: string;
  progression: string;
}

/**
 * Complete specialization metadata record as emitted by the generator.
 *
 * @interface SpecializationMetadata
 * @property {string} vocation - Parent vocation slug (e.g. "Berserker")
 * @property {string} specializationType - Type classification (e.g. "Path", "Domain", "School")
 * @property {string} [flavor] - Introductory flavor text
 * @property {SpecializationSpellcasting} [spellcasting] - Own spellcasting if applicable
 * @property {AlwaysPreparedSpells[]} [preparedSpells] - Level-keyed lists of always-prepared spells. Matches `SpecializationEntity.preparedSpells` relation.
 * @property {SpecializationFeature[]} features - Level-feature list
 */
export interface SpecializationMetadata extends BaseMetadata {
  vocation: string;
  specializationType: string;
  flavor?: string;
  spellcasting?: SpecializationSpellcasting;
  preparedSpells?: AlwaysPreparedSpells[];
  features: SpecializationFeature[];
  tags: string[];
  indexVersion?: number;
}

/**
 * Lightweight projection for table and dropdown display.
 *
 * @interface SpecializationIndexEntry
 * @property {string} vocation - Parent vocation slug
 * @property {string} specializationType - Type classification
 */
export interface SpecializationIndexEntry {
  slug: string;
  title: string;
  vocation: string;
  specializationType: string;
}
