/**
 * @fileoverview The Lethality ladder, with how many creatures sit on each rung.
 * @description The ladder and what each rung is worth belong to the library
 * domain, so this only joins them to what the bestiary happens to hold
 *
 * @module src/modules/metadata-tables/domain/lethalityRungs
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import {
  lethalityLabel,
  lethalityValue,
  tierBonusFor,
  XP_BY_LETHALITY,
} from '@/modules/library/domain/derive';

/**
 * What a rung needs of a creature record.
 *
 * @property {string} [cr] - Lethality as the stat block writes it
 */
export interface LethalityCreature {
  cr?: string;
}

/**
 * One rung of the ladder.
 *
 * @property {number} rating - Lethality as a number
 * @property {string} label - Lethality as a sheet writes it
 * @property {number} xp - XP a creature on the rung is worth
 * @property {number | null} tierBonus - Tier bonus the rung carries
 * @property {number} creatures - Stat blocks written on the rung
 */
export interface LethalityRung {
  rating: number;
  label: string;
  xp: number;
  tierBonus: number | null;
  creatures: number;
}

/**
 * Creature counts keyed by rating.
 *
 * @param {ReadonlyArray<LethalityCreature>} creatures - Creature records
 * @returns {Map<number, number>} Count for every rating that has one
 */
function countsByRating(
  creatures: ReadonlyArray<LethalityCreature>,
): Map<number, number> {
  const counts = new Map<number, number>();

  for (const creature of creatures) {
    if (creature.cr === undefined) continue;
    const rating = lethalityValue(creature.cr);
    if (rating === null) continue;
    counts.set(rating, (counts.get(rating) ?? 0) + 1);
  }

  return counts;
}

/**
 * The whole ladder, in rating order.
 *
 * @param {ReadonlyArray<LethalityCreature>} creatures - Creature records
 * @returns {LethalityRung[]} Every rung, including the ones nothing sits on
 *
 * @example
 * buildLethalityRungs([{ cr: '18' }])[0]; // { rating: 0, label: '0', xp: 10, … }
 */
export function buildLethalityRungs(
  creatures: ReadonlyArray<LethalityCreature>,
): LethalityRung[] {
  const counts = countsByRating(creatures);

  return XP_BY_LETHALITY.map(([rating, xp]) => ({
    rating,
    label: lethalityLabel(rating),
    xp,
    tierBonus: tierBonusFor(rating),
    creatures: counts.get(rating) ?? 0,
  }));
}
