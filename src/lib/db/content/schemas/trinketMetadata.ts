/**
 * @fileoverview Trinket Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateTrinketMetadata.ts`. Every field corresponds to a
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

/**
 * Complete trinket metadata record as emitted by the generator.
 *
 * Derived from `parseTrinketFile()` output in
 * `scripts/metadata/generateTrinketMetadata.ts`.
 *
 * @interface TrinketMetadata
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} file - Relative file path
 * @property {string} link - Wiki link path (e.g. "/library/items/trinkets/bolas")
 * @property {string} itemType - Item category (e.g. "Adventuring Gear")
 * @property {string} [damage] - Damage dice expression (e.g. "1d6")
 * @property {string} [damageType] - Damage type (e.g. "piercing", "bludgeoning")
 * @property {string[]} [properties] - Item properties (e.g. ["thrown", "special"])
 * @property {string} [range] - Weapon or thrown range (e.g. "30/60")
 * @property {string} [weight] - Item weight (e.g. "1 lb.")
 * @property {number} [savingThrowDC] - Saving throw DC
 * @property {string} [savingThrowAbility] - Saving throw ability (e.g. "dexterity")
 * @property {string[]} [specialEffects] - Special effect keywords (e.g. ["restrain", "trip"])
 * @property {string[]} [inflictsConditions] - Conditions inflicted (e.g. ["prone"])
 * @property {string[]} [tags] - Gameplay tags for filtering and search
 * @property {string} [description] - Short prose description extracted from the trinket MDX
 */
export interface TrinketMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  itemType: string;
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  weight?: string;
  savingThrowDC?: number;
  savingThrowAbility?: string;
  specialEffects?: string[];
  inflictsConditions?: string[];
  tags?: string[];
  description?: string;
}

/**
 * Lightweight projection for table display.
 *
 * @interface TrinketIndexEntry
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} itemType - Item category
 * @property {string} [damage] - Damage dice expression
 * @property {string} [damageType] - Damage type
 */
export interface TrinketIndexEntry {
  slug: string;
  title: string;
  itemType: string;
  damage?: string;
  damageType?: string;
}
