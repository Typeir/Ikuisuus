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
 */
export interface FeatureEntry {
  level: number;
  name: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Bloodline entry as returned by `/api/bloodlines`.
 *
 * @interface BloodlineOption
 * @property {string} slug - Bloodline identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path
 * @property {number} [boonBudget] - Total boon point budget
 */
export interface BloodlineOption {
  slug: string;
  title: string;
  file: string;
  boonBudget?: number;
}

/**
 * Vocation entry as returned by `/api/vocations`.
 *
 * @interface VocationOption
 * @property {string} slug - Vocation identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path (e.g. `src/content/en/character-creation/vocations/warlock/main.mdx`)
 * @property {FeatureEntry[]} features - Level–feature progression
 */
export interface VocationOption {
  slug: string;
  title: string;
  file: string;
  features: FeatureEntry[];
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
