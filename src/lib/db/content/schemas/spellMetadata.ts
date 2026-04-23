/**
 * @fileoverview Spell Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateSpellMetadata.ts`. Every field corresponds to a
 * parsed property emitted by `parseSpellFile()`.
 *
 * Spells include both local project spells (parsed from `.mdx` files) and external
 * spells (imported from `spells-external.metadata.json`). External spells may have
 * slightly different fields (e.g. `hasRitual`, external wiki `link`), but share the
 * same core shape.
 *
 * @module lib/db/content/schemas/spellMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Reference to a class/vocation spell list that includes this spell.
 *
 * @property {string} name - Class/vocation name (e.g. "Revenant")
 * @property {string} link - Path to the spell list page
 */
export interface SpellListRef {
  name: string;
  link: string;
}

/**
 * Complete spell metadata record as emitted by the generator.
 *
 * Derived from `parseSpellFile()` output in
 * `scripts/metadata/generateSpellMetadata.ts` and external spell data
 * from `scripts/core/spells-external.metadata.json`.
 *
 * @interface SpellMetadata
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} file - Relative file path ("external" for imported spells)
 * @property {string} link - Wiki link path or external URL
 * @property {number} [level] - Spell level (0 = cantrip, 1–10 = leveled)
 * @property {string} [school] - School of magic (e.g. "Evocation", "Transmutation")
 * @property {string} [quality] - Quality tier for high-level spells (e.g. "Legendary", "Epic")
 * @property {string} [castingTimeRaw] - Raw casting time text (e.g. "1 action", "10 minutes (ritual)")
 * @property {string[]} [castingTime] - Parsed casting time keywords (e.g. ["action"], ["bonus action", "reaction"])
 * @property {string} [range] - Spell range (e.g. "60 feet", "Self", "Touch")
 * @property {boolean} [concentration] - Whether the spell requires concentration
 * @property {string} [duration] - Duration text (e.g. "Instantaneous", "up to 1 minute")
 * @property {boolean} [verbal] - Requires verbal component
 * @property {boolean} [somatic] - Requires somatic component
 * @property {boolean} [material] - Requires material component
 * @property {string} [materialDescription] - Material component description
 * @property {boolean} [hasRitual] - Whether the spell can be cast as a ritual (external spells)
 * @property {string} [description] - Short prose description extracted from the spell MDX
 * @property {string[]} [tags] - Gameplay tags for filtering and search
 * @property {SpellListRef[]} [spellLists] - Class/vocation spell lists that include this spell
 */
export interface SpellMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  level?: number;
  school?: string;
  quality?: string;
  castingTimeRaw?: string;
  castingTime?: string[];
  range?: string;
  concentration?: boolean;
  duration?: string;
  verbal?: boolean;
  somatic?: boolean;
  material?: boolean;
  materialDescription?: string;
  hasRitual?: boolean;
  description?: string;
  tags?: string[];
  spellLists?: SpellListRef[];
}

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/spells/index`.
 *
 * @interface SpellIndexEntry
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {number} [level] - Spell level
 * @property {string} [school] - School of magic
 */
export interface SpellIndexEntry {
  slug: string;
  title: string;
  level?: number;
  school?: string;
}
