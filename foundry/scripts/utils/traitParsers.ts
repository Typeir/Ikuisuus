/**
 * @fileoverview Trait parsing utilities for Foundry VTT transformers.
 * @description Converts metadata trait arrays (damage types, conditions,
 * languages) into dnd5e-compatible trait objects with value arrays and
 * custom text for unrecognized entries.
 *
 * @module foundry/scripts/utils/traitParsers
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link parseDamageTraits} for damage type conversion
 * @see {@link parseConditionTraits} for condition conversion
 */

import { DAMAGE_TYPE_MAP, CONDITION_MAP, LANGUAGE_MAP } from '../constants/dnd5eMaps';

/**
 * Parsed trait result containing recognized dnd5e keys and custom text.
 *
 * @property {string[]} value - Array of recognized dnd5e trait keys
 * @property {string} custom - Semicolon-joined string of unrecognized traits
 */
export interface ParsedTrait {
  value: string[];
  custom: string;
}

/**
 * Parses damage trait strings into dnd5e trait value arrays and custom strings.
 *
 * @param {string[]} traits - Damage trait strings from metadata
 * @returns {ParsedTrait} Parsed dnd5e trait object
 */
export function parseDamageTraits(traits: string[]): ParsedTrait {
  const value: string[] = [];
  const custom: string[] = [];

  for (const trait of traits) {
    const lower = trait.toLowerCase().trim();
    if (DAMAGE_TYPE_MAP[lower]) {
      value.push(DAMAGE_TYPE_MAP[lower]);
    } else {
      custom.push(trait);
    }
  }

  return { value, custom: custom.join('; ') };
}

/**
 * Parses condition immunity strings into dnd5e condition keys.
 *
 * @param {string[]} conditions - Condition immunity strings from metadata
 * @returns {ParsedTrait} Parsed dnd5e condition trait object
 */
export function parseConditionTraits(conditions: string[]): ParsedTrait {
  const value: string[] = [];
  const custom: string[] = [];

  for (const condition of conditions) {
    const lower = condition.toLowerCase().trim();
    if (CONDITION_MAP[lower]) {
      value.push(CONDITION_MAP[lower]);
    } else {
      custom.push(condition);
    }
  }

  return { value, custom: custom.join('; ') };
}

/**
 * Parses language strings into dnd5e language keys.
 *
 * @param {string[]} languages - Language strings from metadata
 * @returns {ParsedTrait} Parsed dnd5e language trait object
 */
export function parseLanguages(languages: string[]): ParsedTrait {
  const value: string[] = [];
  const custom: string[] = [];

  for (const lang of languages) {
    if (lang === '—' || lang === '-') continue;
    const lower = lang.toLowerCase().trim();
    if (LANGUAGE_MAP[lower]) {
      value.push(LANGUAGE_MAP[lower]);
    } else {
      custom.push(lang);
    }
  }

  return { value, custom: custom.join('; ') };
}
