/**
 * @fileoverview Spell Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateSpellMetadata.ts`. Every field corresponds to a
 * parsed property emitted by `parseSpellFile()`.
 *
 * @module lib/db/content/schemas/spellMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { BaseMetadata } from './baseMetadata';

/**
 * Reference to a vocation or specialization spell list that includes this spell.
 *
 * @property {string} name - List name (e.g. "Revenant", "Want of Knowledge")
 * @property {string} [specialization] - Owning specialization slug when the list belongs to a specialization rather than a vocation (derived from a `.specialization` link target)
 */
export interface SpellListRef {
  name: string;
  link: string;
  specialization?: string;
}

/**
 * Complete spell metadata record as emitted by the generator.
 *
 * Derived from `parseSpellFile()` output in
 * `scripts/metadata/generateSpellMetadata.ts`.
 *
 * @interface SpellMetadata
 * @property {number} [level] - Spell level (0 = cantrip, 1–10 = leveled)
 * @property {string} [school] - School of magic (e.g. "Evocation", "Transmutation")
 * @property {string} [quality] - Quality tier for high-level spells (e.g. "Legendary", "Epic")
 * @property {string} [castingTimeRaw] - Raw casting time text (e.g. "1 action", "10 minutes (ritual)")
 * @property {string[]} [castingTime] - Parsed casting time keywords (e.g. ["action"], ["Minor Action", "reaction"])
 * @property {string} [range] - Spell range (e.g. "60 feet", "Self", "Touch")
 * @property {boolean} [concentration] - Whether the spell requires concentration
 * @property {string} [duration] - Duration text (e.g. "Instantaneous", "up to 1 minute")
 * @property {Object} [components] - Spell components matching `SpellComponentEmbed`
 * @property {boolean} [components.verbal] - Requires verbal component
 * @property {boolean} [components.somatic] - Requires somatic component
 * @property {boolean} [components.material] - Requires material component
 * @property {string} [components.materialDescription] - Material component description
 * @property {boolean} [hasRitual] - Whether the spell can be cast as a ritual (external spells)
 * @property {SpellListRef[]} [spellLists] - Class/vocation spell lists that include this spell
 */
export interface SpellMetadata extends BaseMetadata {
  level?: number;
  school?: string;
  quality?: string;
  castingTimeRaw?: string;
  castingTime?: string[];
  range?: string;
  concentration?: boolean;
  duration?: string;
  components?: {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
    materialDescription?: string;
  };
  hasRitual?: boolean;
  spellLists?: SpellListRef[];
  /** Sourcebook the entry comes from */
  source?: string | null;
}

/**
 * Lightweight projection for combobox / dropdown search.
 * Corresponds to the fields returned by `/api/spells/index`.
 *
 * @interface SpellIndexEntry
 * @property {number} [level] - Spell level
 * @property {string} [school] - School of magic
 */
export interface SpellIndexEntry {
  slug: string;
  title: string;
  level?: number;
  school?: string;
}
