/**
 * @fileoverview Heirloom Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateHeirloomMetadata.mjs`. Every field corresponds to a
 * parsed property emitted by `parseHeirloomFile()`.
 *
 * Heirlooms are magical items and equipment that may be weapons, armor, clothing,
 * or other item types with rarity, attunement, weapon properties, and damage info.
 *
 * @module lib/db/content/schemas/heirloomMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* ──────────────────────  Nested Value Objects  ────────────────────── */

/**
 * Charge economy info parsed from the item description.
 *
 * @property {string} [initial] - Initial charge count or dice expression (e.g. "10", "1d6+4")
 * @property {string} [recharge] - Recharge formula (e.g. "1d6+4 at dawn")
 * @property {boolean} [depletes] - True if the item becomes permanently inert when charges are exhausted
 */
export interface HeirloomCharges {
  initial?: string;
  recharge?: string;
  depletes?: boolean;
}

/**
 * Weapon damage extracted from Properties section.
 *
 * @property {string} damage - Dice expression (e.g. "1d10", "2d6")
 * @property {string} damageType - Damage type (e.g. "slashing", "piercing")
 * @property {string} [versatileDamage] - Versatile damage dice (e.g. "1d12")
 */
export interface HeirloomWeaponDamage {
  damage: string;
  damageType: string;
  versatileDamage?: string;
}

/* ────────────────────────  Root Entity  ────────────────────────────── */

/**
 * Complete heirloom metadata record as emitted by the generator.
 *
 * Derived from `parseHeirloomFile()` output in
 * `scripts/metadata/generateHeirloomMetadata.mjs`.
 */
export interface HeirloomMetadata {
  /** URL-friendly identifier */
  slug: string;
  /** Display name */
  title: string;
  /** Relative file path */
  file: string;
  /** Wiki link path (e.g. "/library/items/heirlooms/alfanjon-of-the-crescent-moon") */
  link: string;
  /** Rarity tier (e.g. "common", "uncommon", "rare", "very rare", "legendary") */
  rarity?: string;
  /** High-level item category (e.g. "weapon", "armor", "wondrous item") */
  itemType?: string;
  /** Specific weapon/armor subtype (e.g. "curved longsword", "cloak") */
  weaponType?: string;
  /** Whether attunement is required */
  requiresAttunement?: boolean;
  /** Specific attunement restrictions (e.g. "by a paladin") */
  attunementRequirements?: string;
  /** Weapon property keywords (e.g. ["finesse", "martial", "versatile"]) */
  weaponProperties?: string[];
  /** Weapon mastery keywords (e.g. ["slow", "cleave"]) */
  mastery?: string[];
  /** Parsed weapon damage info */
  weaponDamage?: HeirloomWeaponDamage;
  /** Magic weapon attack bonus (e.g. +1, +3) */
  hitModifier?: number;
  /** Weapon or thrown range (e.g. "30/90") */
  range?: string;
  /** Item weight (e.g. "3 lbs") */
  weight?: string;
  /** Damage types the item can deal */
  damageTypesDealt?: string[];
  /** Saving throw types the item requires */
  savingThrowTypes?: string[];
  /** Charge economy info (initial count, recharge formula, depletion flag) */
  charges?: HeirloomCharges;
  /** Gameplay tags for filtering and search */
  tags?: string[];
  /** Metadata format version */
  indexVersion?: number;
}

/* ──────────────────────  Index Projection  ─────────────────────────── */

/**
 * Lightweight projection for table and dropdown display.
 */
export interface HeirloomIndexEntry {
  slug: string;
  title: string;
  rarity?: string;
  itemType?: string;
  requiresAttunement?: boolean;
}
