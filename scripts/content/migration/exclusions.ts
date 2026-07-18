/**
 * @fileoverview Exclusion rules for dice expression migration
 * @description Lines matching any exclusion rule are skipped entirely.
 * Protects only structural patterns that would produce broken output.
 * All tables and stat blocks are intentionally included — every dice is rollable.
 *
 * @module scripts/content/migration/exclusions
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import type { ExclusionRule } from './types';

function isMigrated(l: string): boolean {
  return /\[%\s*.*?\s*%\]/.test(l);
}
function hasDice(l: string): boolean {
  return /\d+d\d+/.test(l);
}
function hasVarMod(l: string): boolean {
  return /(?:your|the|its)\s+(?:spellcasting\s+ability\s+modifier|Tier\s+Bonus|proficiency\s+bonus|level)/i.test(
    l,
  );
}

/** All exclusion rules. Lines matching ANY exclusion are skipped entirely. */
export const EXCLUSIONS: ExclusionRule[] = [
  { name: 'ALREADY_MIGRATED', test: (l) => isMigrated(l) },
  { name: 'HIT_DIE_DESCRIPTOR', test: (l) => /\bd\d+\s+per\s+[A-Z]/i.test(l) },
  {
    name: 'SCALING_REF',
    test: (l) => /\bat\s+\d+(?:st|nd|rd|th)\s+level\s*\(?\d*d?\d+\)?/i.test(l),
  },
  { name: 'MULTIPLY', test: (l) => /[×x]\s*\d+/.test(l) && hasDice(l) },
  { name: 'D20_TEST', test: (l) => /\bd20\s+[Tt]est\b/.test(l) },
  { name: 'VARIABLE_MODIFIER', test: (l) => hasDice(l) && hasVarMod(l) },
];
