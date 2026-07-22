/**
 * @fileoverview World / Lore Metadata Domain Schema
 * @description Canonical TypeScript types for world/lore metadata records
 * produced by `scripts/metadata/generateWorldMetadata.ts`. Fields are sourced
 * from YAML frontmatter only — the generator does NOT parse knowledge-tier
 * prose sections.
 *
 * When a lore file has no frontmatter, the generator emits a minimal record
 * with `slug`, `title` (from H1), `file`, and `link`. All other fields remain
 * optional.
 *
 * @module lib/db/content/schemas/worldMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Complete world/lore metadata record as emitted by the generator.
 *
 * Derived from `parseWorldFile()` output in
 * `scripts/metadata/generateWorldMetadata.ts`.
 *
 * @interface WorldMetadata
 * @property {string} slug - URL-friendly identifier derived from file path
 * @property {string} title - Display title (from frontmatter or H1)
 * @property {string} file - Relative file path from project root
 * @property {string} link - Page-level wiki link (e.g. `/library/world/the-lands-of-damocles/thule`)
 * @property {string} [description] - Short prose description from frontmatter
 * @property {string[]} [tags] - Lore/faction/gameplay tags from frontmatter
 * @property {string} [category] - Top-level content category from frontmatter
 *   (e.g. 'nation', 'deity', 'creature', 'event', 'artifact', 'character')
 * @property {string[]} [relatedSlugs] - Cross-linked slugs from frontmatter
 * @property {string[]} [aliases] - Alternate names from frontmatter
 * @property {string[]} [knowledgeTiers] - Declared tier names from frontmatter
 *   (e.g. ['Common', 'Advanced', 'Deep', 'Truth'])
 * @property {number} [indexVersion] - Schema version number
 */
export interface WorldMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  description?: string;
  tags?: string[];
  category?: string;
  relatedSlugs?: string[];
  aliases?: string[];
  knowledgeTiers?: string[];
  indexVersion?: number;
}

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/world/index`.
 *
 * @interface WorldIndexEntry
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} [category] - Top-level content category
 */
export interface WorldIndexEntry {
  slug: string;
  title: string;
  category?: string;
}
