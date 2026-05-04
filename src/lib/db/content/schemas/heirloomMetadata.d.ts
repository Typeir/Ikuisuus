/**
 * @fileoverview Heirloom Metadata Domain Schema
 * @description Canonical TypeScript types derived from the real metadata output of
 * `scripts/metadata/generateHeirloomMetadata.ts`. Every field corresponds to a
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

 * Complete heirloom metadata record as emitted by the generator.
 *
 * Derived from `parseHeirloomFile()` output in
 * `scripts/metadata/generateHeirloomMetadata.ts`.
 *
 * @interface HeirloomMetadata
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} file - Relative file path
 * @property {string} link - Wiki link path (e.g. "/library/items/heirlooms/alfanjon-of-the-crescent-moon")
 * @property {string} [rarity] - Rarity tier (e.g. "common", "uncommon", "rare", "very rare", "legendary")
 * @property {string} [itemType] - High-level item category (e.g. "weapon", "armor", "wondrous item")
 * @property {string} [weaponType] - Specific weapon/armor subtype (e.g. "curved longsword", "cloak")
 * @property {boolean} [requiresAttunement] - Whether attunement is required
 * @property {string} [attunementRequirements] - Specific attunement restrictions (e.g. "by a paladin")
 * @property {string[]} [weaponProperties] - Weapon property keywords (e.g. ["finesse", "martial", "versatile"])
 * @property {string[]} [mastery] - Weapon mastery keywords (e.g. ["slow", "cleave"])
 * @property {string} [weaponDamage] - Weapon damage dice expression (e.g. "1d10"). Matches `HeirloomEntity.weaponDamage`.
 * @property {string} [weaponDamageType] - Weapon damage type (e.g. "slashing"). Matches `HeirloomEntity.weaponDamageType`.
 * @property {string} [versatileDamage] - Versatile damage dice expression (e.g. "1d12"). Matches `HeirloomEntity.versatileDamage`.
 * @property {number} [hitModifier] - Magic weapon attack bonus (e.g. +1, +3)
 * @property {string} [range] - Weapon or thrown range (e.g. "30/90")
 * @property {string} [weight] - Item weight (e.g. "3 lbs")
 * @property {string[]} [damageTypesDealt] - Damage types the item can deal
 * @property {string[]} [savingThrowTypes] - Saving throw types the item requires
 * @property {HeirloomCharges} [charges] - Charge economy info (initial count, recharge formula, depletion flag)
 * @property {string[]} [tags] - Gameplay tags for filtering and search
 * @property {string} [description] - Short prose description extracted from the heirloom MDX
 * @property {number} [indexVersion] - Metadata format version
 */
export interface HeirloomMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  rarity?: string;
  itemType?: string;
  weaponType?: string;
  requiresAttunement?: boolean;
  attunementRequirements?: string;
  weaponProperties?: string[];
  mastery?: string[];
  weaponDamage?: string;
  weaponDamageType?: string;
  versatileDamage?: string;
  hitModifier?: number;
  range?: string;
  weight?: string;
  damageTypesDealt?: string[];
  savingThrowTypes?: string[];
  charges?: HeirloomCharges;
  tags?: string[];
  description?: string;
  indexVersion?: number;
}

/**
 * Lightweight projection for table and dropdown display.
 *
 * @interface HeirloomIndexEntry
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} [rarity] - Rarity tier
 * @property {string} [itemType] - Item category
 * @property {boolean} [requiresAttunement] - Whether attunement is required
 */
export interface HeirloomIndexEntry {
  slug: string;
  title: string;
  rarity?: string;
  itemType?: string;
  requiresAttunement?: boolean;
}
