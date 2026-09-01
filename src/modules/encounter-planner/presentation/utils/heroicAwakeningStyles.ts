/**
 * @fileoverview Heroic Awakening Styling Utilities
 * @description Utilities for determining CSS classes and styling for Heroic Awakening combatants.
 * Maps affix text to CSS class names for visual styling in PlayMode.
 * 
 * @module modules/encounter-planner/presentation/utils/heroicAwakeningStyles
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires @/lib/utils/classNameMerge
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types
 * @requires @/modules/encounter-planner/domain/storage/encounterStorageKeys
 */

import { cn } from '@/lib/utils/classNameMerge';
import type { HeroicAwakeningState } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { HeroicAffix } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';

/**
 * Valid affix keys for CSS class generation.
 * Keys are lowercase.
 * @type {string}
 */
export type AffixKey = 
  | 'bloodthirsty'
  | 'championed'
  | 'crusading'
  | 'flametongued'
  | 'frostveined'
  | 'psionic'
  | 'rakish'
  | 'stormbound'
  | 'sulphurous';

/**
 * Awakening tier type for CSS class generation.
 * @type {string}
 */
export type AwakeningTier = 'legendary' | 'mythic';

/**
 * Result of computing awakening class names for a combatant.
 * 
 * @interface AwakeningClassResult
 * @property {boolean} isAwakened - Whether the combatant is heroically awakened
 * @property {AffixKey | null} primaryAffix - The first affix (determines visual identity)
 * @property {AwakeningTier | null} tier - The tier if legendary or mythic
 * @property {string[]} classNames - Array of CSS class names to apply
 */
export interface AwakeningClassResult {
  isAwakened: boolean;
  primaryAffix: AffixKey | null;
  tier: AwakeningTier | null;
  classNames: string[];
}

/**
 * Set of valid affix values for validation.
 * @constant
 */
const VALID_AFFIXES = new Set<string>(
  Object.values(HeroicAffix).map(v => v.toLowerCase())
);

/**
 * Converts affix text to a valid CSS class key.
 * Returns null if the affix is not recognized.
 * 
 * @function normalizeAffixToKey
 * @param {string} affixText - The affix text from AffixEntry
 * @returns {AffixKey | null} Normalized affix key or null if invalid
 * 
 * @example
 * normalizeAffixToKey('Bloodthirsty'); // 'bloodthirsty'
 * normalizeAffixToKey('STORMBOUND'); // 'stormbound'
 * normalizeAffixToKey('Unknown'); // null
 */
export function normalizeAffixToKey(affixText: string): AffixKey | null {
  const normalized = affixText.trim().toLowerCase();
  if (VALID_AFFIXES.has(normalized)) {
    return normalized as AffixKey;
  }
  return null;
}

/**
 * Determines the awakening tier based on affix count.
 * 
 * @function getAwakeningTier
 * @param {number} affixCount - Number of affixes
 * @returns {AwakeningTier | null} 'legendary' for 2, 'mythic' for 3+, null otherwise
 * 
 * @example
 * getAwakeningTier(1); // null
 * getAwakeningTier(2); // 'legendary'
 * getAwakeningTier(3); // 'mythic'
 */
export function getAwakeningTier(affixCount: number): AwakeningTier | null {
  if (affixCount >= 3) return 'mythic';
  if (affixCount === 2) return 'legendary';
  return null;
}

/**
 * Computes the CSS class names for a heroically awakened combatant.
 * 
 * @function computeAwakeningClasses
 * @param {HeroicAwakeningState} heroicAwakening - The combatant's awakening state
 * @returns {AwakeningClassResult} Object containing class names and metadata
 * 
 * @example
 * // Single affix awakened
 * computeAwakeningClasses({ awakened: true, affixes: [{ text: 'Bloodthirsty' }], ... });
 * // Returns: { isAwakened: true, primaryAffix: 'bloodthirsty', tier: null, classNames: ['awakened', 'awakened--bloodthirsty'] }
 * 
 * @example
 * // Legendary (2 affixes)
 * computeAwakeningClasses({ awakened: true, affixes: [{ text: 'Stormbound' }, { text: 'Psionic' }], ... });
 * // Returns: { isAwakened: true, primaryAffix: 'stormbound', tier: 'legendary', classNames: ['awakened', 'awakened--stormbound', 'awakened--legendary'] }
 * 
 * @example
 * // Not awakened
 * computeAwakeningClasses({ awakened: false, affixes: [], ... });
 * // Returns: { isAwakened: false, primaryAffix: null, tier: null, classNames: [] }
 */
export function computeAwakeningClasses(heroicAwakening: HeroicAwakeningState): AwakeningClassResult {
  if (!heroicAwakening.awakened || heroicAwakening.affixes.length === 0) {
    return {
      isAwakened: false,
      primaryAffix: null,
      tier: null,
      classNames: [],
    };
  }

  const classNames: string[] = ['awakened'];
  const primaryAffixText = heroicAwakening.affixes[0]?.text ?? '';
  const primaryAffix = normalizeAffixToKey(primaryAffixText);

  const tier = getAwakeningTier(heroicAwakening.affixes.length);

  if (primaryAffix && tier !== 'legendary' && tier !== 'mythic') {
    classNames.push(`awakened--${primaryAffix}`);
  }

  if (tier) {
    classNames.push(`awakened--${tier}`);
  }

  return {
    isAwakened: true,
    primaryAffix,
    tier,
    classNames,
  };
}

/**
 * Generates the CSS class string for a combatant row element.
 * 
 * @function getAwakeningClassString
 * @param {HeroicAwakeningState} heroicAwakening - The combatant's awakening state
 * @param {string} styles - CSS module styles object
 * @returns {string} Space-separated class string for the element
 * 
 * @example
 * getAwakeningClassString(heroicAwakening, styles);
 * // Returns: 'awakened awakened--bloodthirsty awakened--legendary'
 */
export function getAwakeningClassString(
  heroicAwakening: HeroicAwakeningState,
  styles: Record<string, string>
): string {
  const { classNames } = computeAwakeningClasses(heroicAwakening);
  return cn(...classNames.map(className => styles[className] ?? className));
}
