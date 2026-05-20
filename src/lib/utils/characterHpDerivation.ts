/**
 * @fileoverview Character HP Derivation Utilities
 * @description Pure helpers that derive HP adjustments from changes to a
 * character's CON modifier. Used by the overview tab to retroactively rebase
 * `hpMax` (and clamp `hpCurrent`) whenever the CON modifier drifts from the
 * value captured on each committed hit-die roll.
 *
 * @module lib/utils/characterHpDerivation
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import type { HitDieRollEntry } from '../types/hitDice';

/**
 * Result of {@link rebaseHitDiceLogForCon}.
 *
 * @interface HpConRebaseResult
 * @property {number} delta - Net HP change to apply to `hpMax` (positive when CON went up, negative when it went down)
 * @property {HitDieRollEntry[]} rebasedLog - The original log with `conMod` updated to `currentConMod` on every confirmed entry. Reference-equal to `log` when no change is needed.
 */
export interface HpConRebaseResult {
  delta: number;
  rebasedLog: HitDieRollEntry[];
}

/**
 * Computes the cumulative HP delta needed to bring every confirmed hit-die
 * roll's `conMod` snapshot up-to-date with the character's current CON
 * modifier, and returns a rebased log with the snapshots refreshed.
 *
 * Unconfirmed entries (those not yet added to HP) are left untouched so the
 * roller panel still applies the current CON when the player eventually
 * confirms the roll.
 *
 * @function rebaseHitDiceLogForCon
 * @param {HitDieRollEntry[]} log - Existing hit dice log
 * @param {number} currentConMod - Character's current CON modifier
 * @returns {HpConRebaseResult} Net delta plus the rebased log
 */
export function rebaseHitDiceLogForCon(
  log: HitDieRollEntry[],
  currentConMod: number,
): HpConRebaseResult {
  const delta = log.reduce(
    (sum, e) => (e.addedToHp ? sum + (currentConMod - e.conMod) : sum),
    0,
  );
  if (delta === 0) return { delta: 0, rebasedLog: log };
  const rebasedLog = log.map((e) =>
    e.addedToHp ? { ...e, conMod: currentConMod } : e,
  );
  return { delta, rebasedLog };
}
