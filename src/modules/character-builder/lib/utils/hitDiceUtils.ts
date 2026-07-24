/**
 * @fileoverview Hit Dice Utilities
 * @description Pure derivations over the per-level hit die roll log. `hpMax` is
 * treated as a pure function of the log rather than an accumulator, so that
 * re-rolls, level/vocation pruning, and CON changes can never let it drift or
 * strand phantom HP from removed entries.
 *
 * @module modules/character-builder/lib/utils/hitDiceUtils
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { HitDieRollEntry } from '@/lib/types/hitDice';

/**
 * Recomputes maximum HP from the hit dice log: the sum of `(result + conMod)`
 * across every entry that has been confirmed and added to HP. `conMod` is the
 * value frozen on each entry at creation time — never a live modifier — so the
 * result is deterministic regardless of how many times dice were re-rolled or
 * how CON has changed since. Clamped at 0 so a degenerate log can never yield a
 * negative maximum.
 *
 * @function recalculateHpMax
 * @param {HitDieRollEntry[]} log - The character's hit dice roll log
 * @returns {number} Maximum HP contributed by confirmed hit dice (>= 0)
 */
export function recalculateHpMax(log: HitDieRollEntry[]): number {
  const total = log.reduce(
    (sum, e) => (e.addedToHp ? sum + (e.result ?? 0) + e.conMod : sum),
    0,
  );
  return Math.max(0, total);
}
