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

/* ──────────────────────  Nested Value Objects  ────────────────────── */

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

/* ────────────────────────  Root Entity  ────────────────────────────── */

/**
 * Complete spell metadata record as emitted by the generator.
 *
 * Derived from `parseSpellFile()` output in
 * `scripts/metadata/generateSpellMetadata.ts` and external spell data
 * from `scripts/core/spells-external.metadata.json`.
 */
export interface SpellMetadata {
  /** URL-friendly identifier */
  slug: string;
  /** Display name */
  title: string;
  /** Relative file path ("external" for imported spells) */
  file: string;
  /** Wiki link path or external URL */
  link: string;
  /** Spell level (0 = cantrip, 1–10 = leveled) */
  level?: number;
  /** School of magic (e.g. "Evocation", "Transmutation") */
  school?: string;
  /** Quality tier for high-level spells (e.g. "Legendary", "Epic") */
  quality?: string;
  /** Raw casting time text (e.g. "1 action", "10 minutes (ritual)") */
  castingTimeRaw?: string;
  /** Parsed casting time keywords (e.g. ["action"], ["bonus action", "reaction"]) */
  castingTime?: string[];
  /** Spell range (e.g. "60 feet", "Self", "Touch") */
  range?: string;
  /** Whether the spell requires concentration */
  concentration?: boolean;
  /** Duration text (e.g. "Instantaneous", "up to 1 minute") */
  duration?: string;
  /** Requires verbal component */
  verbal?: boolean;
  /** Requires somatic component */
  somatic?: boolean;
  /** Requires material component */
  material?: boolean;
  /** Material component description */
  materialDescription?: string;
  /** Whether the spell can be cast as a ritual (external spells) */
  hasRitual?: boolean;
  /** Gameplay tags for filtering and search */
  tags?: string[];
  /** Class/vocation spell lists that include this spell */
  spellLists?: SpellListRef[];
}

/* ──────────────────────  Index Projection  ─────────────────────────── */

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/spells/index`.
 */
export interface SpellIndexEntry {
  slug: string;
  title: string;
  level?: number;
  school?: string;
}
