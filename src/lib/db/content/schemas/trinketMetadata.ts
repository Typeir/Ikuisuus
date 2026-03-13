/**
 * @fileoverview Trinket Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateTrinketMetadata.mjs`. Every field corresponds to a
 * parsed property emitted by `parseTrinketFile()`.
 *
 * Trinkets are consumable adventuring gear with damage, range, weight, and
 * special effects. Unlike heirlooms, they do not have rarity, attunement,
 * or weapon mastery properties.
 *
 * @module lib/db/content/schemas/trinketMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* ────────────────────────  Root Entity  ────────────────────────────── */

/**
 * Complete trinket metadata record as emitted by the generator.
 *
 * Derived from `parseTrinketFile()` output in
 * `scripts/metadata/generateTrinketMetadata.mjs`.
 */
export interface TrinketMetadata {
  /** URL-friendly identifier */
  slug: string;
  /** Display name */
  title: string;
  /** Relative file path */
  file: string;
  /** Wiki link path (e.g. "/library/items/trinkets/bolas") */
  link: string;
  /** Item category (e.g. "Adventuring Gear") */
  itemType: string;
  /** Damage dice expression (e.g. "1d6") */
  damage?: string;
  /** Damage type (e.g. "piercing", "bludgeoning") */
  damageType?: string;
  /** Item properties (e.g. ["thrown", "special"]) */
  properties?: string[];
  /** Weapon or thrown range (e.g. "30/60") */
  range?: string;
  /** Item weight (e.g. "1 lb.") */
  weight?: string;
  /** Saving throw DC */
  savingThrowDC?: number;
  /** Saving throw ability (e.g. "dexterity") */
  savingThrowAbility?: string;
  /** Special effect keywords (e.g. ["restrain", "trip"]) */
  specialEffects?: string[];
  /** Conditions inflicted (e.g. ["prone"]) */
  inflictsConditions?: string[];
  /** Gameplay tags for filtering and search */
  tags?: string[];
}

/* ──────────────────────  Index Projection  ─────────────────────────── */

/**
 * Lightweight projection for table display.
 */
export interface TrinketIndexEntry {
  slug: string;
  title: string;
  itemType: string;
  damage?: string;
  damageType?: string;
}
