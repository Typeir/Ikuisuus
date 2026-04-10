/**
 * @fileoverview Specialization Metadata Domain Schema
 * @description Canonical TypeScript types for specialization metadata generated from
 * `scripts/metadata/generateSpecializationMetadata.ts`.
 *
 * Each specialization record captures the subclass features, type classification,
 * optional always-prepared spells, and optional spellcasting for third-caster subclasses.
 *
 * @module lib/db/content/schemas/specializationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* ──────────────────────  Nested Value Objects  ────────────────────── */

/**
 * A single feature gained at a specific level.
 *
 * @property {number} level - Character level at which the feature is gained
 * @property {string} name - Feature display name
 */
export interface SpecializationFeature {
  level: number;
  name: string;
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

/* ────────────────────────  Root Entity  ────────────────────────────── */

/**
 * Complete specialization metadata record as emitted by the generator.
 *
 * @property {string} slug - URL-friendly identifier (e.g. "path-of-the-berserker")
 * @property {string} title - Display name (e.g. "Path of the Berserker")
 * @property {string} file - Relative file path from content root
 * @property {string} link - Public route path
 * @property {string} vocation - Parent vocation slug (e.g. "barbarian")
 * @property {string} specializationType - Type classification (e.g. "Path", "Domain", "School")
 * @property {string} [flavor] - Introductory flavor text
 * @property {SpecializationSpellcasting} [spellcasting] - Own spellcasting if applicable
 * @property {AlwaysPreparedSpells[]} [spellsAlwaysPrepared] - Level-keyed lists of always-prepared spells
 * @property {SpecializationFeature[]} features - Level-feature list
 * @property {string[]} tags - Derived gameplay tags for filtering
 * @property {number} [indexVersion] - Metadata schema version
 */
export interface SpecializationMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  vocation: string;
  specializationType: string;
  flavor?: string;
  spellcasting?: SpecializationSpellcasting;
  spellsAlwaysPrepared?: AlwaysPreparedSpells[];
  features: SpecializationFeature[];
  tags: string[];
  indexVersion?: number;
}

/* ──────────────────────  Index Projection  ─────────────────────────── */

/**
 * Lightweight projection for table and dropdown display.
 *
 * @property {string} slug - Specialization slug
 * @property {string} title - Specialization title
 * @property {string} vocation - Parent vocation slug
 * @property {string} specializationType - Type classification
 */
export interface SpecializationIndexEntry {
  slug: string;
  title: string;
  vocation: string;
  specializationType: string;
}
