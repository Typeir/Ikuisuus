/**
 * @fileoverview Character Sheet Pure Helpers
 * @description Pure factory and math utilities for character sheets.
 */


/**
 * Proficiency levels from unproficient to savant.
 *
 * @constant PROFICIENCY_CYCLE
 */
export const PROFICIENCY_CYCLE = [
  'none',
  'familiarity',
  'proficient',
  'expertise',
  'savanthood',
];

/**
 * Proficiency pip levels (excludes 'none').
 *
 * @constant PROFICIENCY_LEVELS
 */
export const PROFICIENCY_LEVELS = [
  'familiarity',
  'proficient',
  'expertise',
  'savanthood',
];

/**
 * Proficiency level display labels and tooltips.
 */
export const PROFICIENCY_LABELS = {
  none: { label: 'Unproficient', tooltip: 'No proficiency bonus' },
  familiarity: { label: 'Familiarity', tooltip: '½ proficiency bonus' },
  proficient: { label: 'Proficient', tooltip: 'Full proficiency bonus' },
  expertise: { label: 'Expertise', tooltip: 'Double proficiency bonus' },
  savanthood: { label: 'Savanthood', tooltip: 'Triple proficiency bonus' },
};

/**
 * Compute proficiency bonus from level.
 */
export const computeProficiencyBonus = (level: number): number =>
  level >= 30 ? 10 : Math.ceil(1 + level / 4);

/**
 * Compute ability modifier from an ability score.
 */
export const computeAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);
