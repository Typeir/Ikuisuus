/**
 * @fileoverview Feat Metadata Domain Schema
 * @description Canonical TypeScript types for feat metadata generated from
 * `scripts/metadata/generateFeatMetadata.ts`.
 *
 * Each record describes a single feat plain `.mdx` file under
 * `src/content/{locale}/character-creation/feats/`. The `features` array
 * captures named mechanics (bold bullet items) with 1-indexed line anchors
 * into the source MDX, enabling O(1) shard extraction.
 *
 * @module lib/db/content/schemas/featMetadata
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * A named mechanic within a feat, parsed from a bold bullet item
 * (`- **Name.** description`).
 *
 * @interface FeatFeature
 * @property {string} name - Mechanic display name (text between `**` and `.**`)
 * @property {number} [startLine] - 1-indexed start line of the bullet block in the source MDX
 * @property {number} [endLine] - 1-indexed last line of the bullet block in the source MDX
 * @property {string[]} tags - Derived gameplay tags for this mechanic
 */
export interface FeatFeature {
  name: string;
  startLine?: number;
  endLine?: number;
  tags: string[];
}

/**
 * Optional ability score increase granted by a feat.
 *
 * @interface FeatAbilityIncrease
 * @property {string[]} abilities - Ability score keys (`str`, `dex`, ...) the player may apply the increase to
 * @property {number} amount - Amount applied (typically `1`)
 * @property {number} [maximum] - Cap on the resulting score (typically `20`)
 */
export interface FeatAbilityIncrease {
  abilities: string[];
  amount: number;
  maximum?: number;
}

/**
 * Complete feat metadata record as emitted by the generator.
 *
 * @interface FeatMetadata
 * @property {string} slug - Filename-derived slug
 * @property {string} title - H1 title
 * @property {string} file - Workspace-relative path to the source MDX
 * @property {string} link - Library route to the rendered page
 * @property {string} [description] - Short prose description used in tooltips
 * @property {string} [prerequisite] - Raw prerequisite text (italics line)
 * @property {boolean} hasPrerequisite - True when a non-trivial prerequisite is parsed
 * @property {FeatAbilityIncrease} [abilityIncrease] - Parsed ability score increase
 * @property {FeatFeature[]} [features] - Named mechanics parsed from bold bullet items
 * @property {string[]} [grants] - Tag-based proficiency grants (e.g. `weapon:martial`, `skill:persuasion:expertise`)
 * @property {boolean} [multiSelect] - When true, the feat may be selected more than once (e.g. Ability Score Improvement). Backed by the `multi-select` tag so it survives both FS and PG backends.
 * @property {string[]} tags - Derived gameplay tags
 * @property {number} [indexVersion] - Schema version
 */
export interface FeatMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  description?: string;
  prerequisite?: string;
  hasPrerequisite: boolean;
  abilityIncrease?: FeatAbilityIncrease;
  features?: FeatFeature[];
  grants?: string[];
  multiSelect?: boolean;
  tags: string[];
  indexVersion?: number;
}
