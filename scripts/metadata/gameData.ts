/**
 * @fileoverview Game Data Static Accessors
 * @description Typed accessors for shared-data.json game rules, item data,
 * and spell data. All methods require the loaded SharedData object to be passed
 * explicitly (no side-loaded singletons).
 *
 * @module scripts/metadata/gameData
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { TEXT } from './parsingPatterns';
import type { AbilityRef, SharedData } from './sharedData';

/**
 * Accessor methods for game rules data (creature stats, damage, conditions, etc.)
 */
export class GameData {
  /** @returns {string[]} All recognized damage types */
  static getDamageTypes(data: SharedData): string[] {
    return data.gameData.damageTypes;
  }

  /** @returns {string[]} All recognized conditions */
  static getConditions(data: SharedData): string[] {
    return data.gameData.conditions;
  }

  /** @returns {AbilityRef[]} Six ability score references */
  static getAbilities(data: SharedData): AbilityRef[] {
    return data.gameData.abilities;
  }

  /** @returns {string[]} Creature size categories */
  static getSizes(data: SharedData): string[] {
    return data.gameData.sizes;
  }

  /** @returns {string[]} Special sense types */
  static getSenses(data: SharedData): string[] {
    return data.gameData.senses;
  }

  /** @returns {string[]} Movement mode types */
  static getMovementTypes(data: SharedData): string[] {
    return data.gameData.movementTypes;
  }

  /** @returns {string[]} Mechanic keyword types */
  static getMechanicTypes(data: SharedData): string[] {
    return data.gameData.mechanicTypes;
  }

  /** @returns {string[]} Creature type categories */
  static getCreatureTypes(data: SharedData): string[] {
    return data.gameData.creatureTypes;
  }
}

/**
 * Accessor methods for item-related data (rarities, weapon types, properties, etc.)
 */
export class ItemData {
  /** @returns {string[]} Item rarity tiers */
  static getRarities(data: SharedData): string[] {
    return data.itemData.rarities;
  }

  /** @returns {string[]} All item type keywords */
  static getItemTypes(data: SharedData): string[] {
    return data.itemData.itemTypes;
  }

  /** @returns {string[]} Weapon property keywords */
  static getWeaponProperties(data: SharedData): string[] {
    return data.itemData.weaponProperties;
  }

  /** @returns {string[]} Weapon mastery properties */
  static getMasteryProperties(data: SharedData): string[] {
    return data.itemData.masteryProperties;
  }

  /** @returns {string[]} Weapon subtypes */
  static getWeaponTypes(data: SharedData): string[] {
    return data.itemData.weaponTypes;
  }

  /** @returns {string[]} Armor subtypes */
  static getArmorTypes(data: SharedData): string[] {
    return data.itemData.armorTypes;
  }

  /** @returns {string[]} Clothing subtypes */
  static getClothingTypes(data: SharedData): string[] {
    return data.itemData.clothingTypes;
  }

  /** @returns {string[]} Base item categories (weapon, armor, clothing) */
  static getBaseCategoryTypes(data: SharedData): string[] {
    return data.itemData.baseCategoryTypes;
  }

  /**
   * Detects item type from text using pattern matching.
   *
   * @param {string[]} lines - File lines to analyze
   * @param {SharedData} data - Shared data object
   * @returns {string | undefined} Detected item type or undefined
   */
  static detectItemType(lines: string[], data: SharedData): string | undefined {
    const itemTypes = this.getItemTypes(data);
    const weaponTypes = this.getWeaponTypes(data);
    const armorTypes = this.getArmorTypes(data);
    const clothingTypes = this.getClothingTypes(data);

    const weaponPattern =
      weaponTypes.length > 0
        ? new RegExp(
            `\\b(${weaponTypes.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|weapon)\\b`,
            'i',
          )
        : /\bweapon\b/i;

    const armorPattern =
      armorTypes.length > 0
        ? new RegExp(
            `\\b(${armorTypes.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|armor)\\b`,
            'i',
          )
        : /\barmor\b/i;

    const clothingPattern =
      clothingTypes.length > 0
        ? new RegExp(
            `\\b(${clothingTypes.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|clothing)\\b`,
            'i',
          )
        : /\bclothing\b/i;

    /* Header italics live before the first HR; leading JSX pushes them past
       any fixed line offset. */
    const cutoffIndex = lines.findIndex((l) => TEXT.horizontalRule.test(l));
    const headerLines =
      cutoffIndex === -1 ? lines.slice(0, 40) : lines.slice(0, cutoffIndex);

    const italicLines = headerLines
      .filter((l) => /^_.*_$/.test(l.trim()))
      .map((l) => l.replace(/^_/, '').replace(/_$/, '').trim().toLowerCase());

    for (const italicLine of italicLines) {
      if (/\bweapon\b/i.test(italicLine)) return 'weapon';
      if (/\barmor\b/i.test(italicLine)) return 'armor';
      if (/\bclothing\b/i.test(italicLine)) return 'clothing';

      for (const itemType of itemTypes) {
        const escapedType = itemType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${escapedType}\\b`, 'i').test(italicLine)) {
          return itemType;
        }
      }

      if (weaponPattern.test(italicLine)) return 'weapon';
    }

    const typePropertyLine = lines.find((l) =>
      /^-?\s*\*\*Type\*\*\s*:/i.test(l),
    );
    if (typePropertyLine) {
      const typeValue = typePropertyLine
        .replace(/^-?\s*\*\*Type\*\*\s*:/i, '')
        .trim()
        .toLowerCase();

      for (const itemType of itemTypes) {
        const escapedType = itemType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${escapedType}\\b`, 'i').test(typeValue)) {
          return itemType;
        }
      }

      if (weaponPattern.test(typeValue)) return 'weapon';
      if (armorPattern.test(typeValue)) return 'armor';
      if (clothingPattern.test(typeValue)) return 'clothing';

      const customType = typeValue.split(/[,(]/)[0].trim().toLowerCase();

      if (customType) return customType;
    }

    return undefined;
  }
}
