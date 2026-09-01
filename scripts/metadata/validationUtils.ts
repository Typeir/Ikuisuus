/**
 * @fileoverview Metadata Validation Utilities
 * @description Validates tags against known categories/values and checks metadata
 * structure against expected schemas.
 *
 * @module scripts/metadata/validationUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { SharedData } from './sharedData';

/**
 * Result of a metadata validation check.
 *
 * @property {boolean} valid - Whether the metadata passed all checks
 * @property {string[]} errors - List of validation errors found
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a tag against known categories and values from shared data.
 *
 * @param {string} tag - Tag to validate (format "category:value")
 * @param {SharedData} sharedData - Shared game data for lookups
 * @returns {boolean} True if the tag is valid
 */
export function validateTag(tag: string, sharedData: SharedData): boolean {
  const colonIndex = tag.indexOf(':');
  if (colonIndex === -1) return false;

  const category = tag.substring(0, colonIndex);
  const value = tag.substring(colonIndex + 1);
  const validCategories = sharedData.taxonomies.tagCategories;

  if (!validCategories.includes(category)) {
    return false;
  }

  switch (category) {
    case 'damage':
      return sharedData.gameData.damageTypes.includes(value);
    case 'condition':
      return sharedData.gameData.conditions.includes(value);
    case 'creature':
      return sharedData.gameData.creatureTypes.includes(value);
    case 'size':
      return sharedData.gameData.sizes.includes(value);
    case 'faction':
      return sharedData.worldData.factions.includes(value);
    case 'location':
      return sharedData.worldData.locations.includes(value);
    default:
      return true;
  }
}

/**
 * Determines rarity tag from a challenge rating based on configured thresholds.
 *
 * @param {number | string} challengeRating - CR value (e.g. 5, "1/2", "0.25")
 * @param {SharedData} sharedData - Shared game data with rarity thresholds
 * @returns {string} Rarity tag (e.g. "rarity:rare")
 */
export function getRarityFromCR(
  challengeRating: number | string,
  sharedData: SharedData,
): string {
  const crValue =
    typeof challengeRating === 'string'
      ? parseFloat(challengeRating)
      : challengeRating;
  const thresholds = sharedData.taxonomies.rarityThresholds;

  for (const threshold of thresholds) {
    if (crValue >= threshold.minCR) {
      return threshold.tag;
    }
  }

  return 'rarity:common';
}

/**
 * Validates a metadata object against the expected schema for its content type.
 *
 * @param {Record<string, unknown>} metadata - Metadata to validate
 * @param {'monster' | 'heirloom' | 'spell' | 'trinket'} type - Content type
 * @param {SharedData} sharedData - Shared data for tag validation
 * @returns {ValidationResult} Validation result with errors
 */
export function validateMetadata(
  metadata: Record<string, unknown>,
  type: 'monster' | 'heirloom' | 'spell' | 'trinket',
  sharedData: SharedData,
): ValidationResult {
  const errors: string[] = [];

  if (!metadata.slug || typeof metadata.slug !== 'string') {
    errors.push('Missing or invalid slug');
  }

  if (!metadata.title || typeof metadata.title !== 'string') {
    errors.push('Missing or invalid title');
  }

  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('Tags must be an array');
  }

  if (Array.isArray(metadata.tags)) {
    for (const tag of metadata.tags as string[]) {
      if (!validateTag(tag, sharedData)) {
        errors.push(`Invalid tag: ${tag}`);
      }
    }
  }

  if (type === 'monster') {
    if (!metadata.creatureType) errors.push('Missing creature type');
    if (metadata.cr === undefined) errors.push('Missing challenge rating');
  } else if (type === 'heirloom') {
    if (!metadata.rarity) errors.push('Missing rarity');
    if (!metadata.itemType) errors.push('Missing item type');
  } else if (type === 'spell') {
    if (metadata.level === undefined) errors.push('Missing spell level');
  }

  return { valid: errors.length === 0, errors };
}
