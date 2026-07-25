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

import type { CharacterSheet } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { computeAbilityModifier } from './characterStorage';
import { collectActiveGrants, parseGrant } from './grants';
import { resolveHpTerm, type HpScope } from './hpGrants';

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

/**
 * A character's derived hit points. `base` is the maximum from rolled dice, CON,
 * and passive `hp` grants; `effective` is `base` reduced by the grievous-wound
 * pool (the value the sheet shows and against which current HP is measured).
 *
 * @interface DerivedHitPoints
 * @property {number} base - Maximum HP from dice + CON + hp grants (>= 0)
 * @property {number} effective - `base` minus grievous wounds (>= 0)
 */
export interface DerivedHitPoints {
  base: number;
  effective: number;
}

/**
 * The rolled-dice counts a scope multiplier reads: the total assigned dice and
 * the per-vocation / per-specialization breakdowns.
 *
 * @interface HpScopeContext
 * @property {number} totalRolled - Count of assigned (rolled + added) hit dice
 * @property {Record<string, number>} perVocation - Assigned dice by vocation slug
 * @property {Record<string, number>} perSpecialization - Assigned dice by specialization slug
 */
interface HpScopeContext {
  totalRolled: number;
  perVocation: Record<string, number>;
  perSpecialization: Record<string, number>;
}

/**
 * Coerces a non-finite result to 0 so a degenerate term or scope can never
 * poison the aggregate with `NaN`/`Infinity`.
 *
 * @function finiteOrZero
 * @param {number} value - The value to guard
 * @returns {number} `value` when finite, otherwise 0
 */
function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Resolves an {@link HpScope} to its level-count multiplier against the rolled
 * dice. `once` is flat; the level scopes read the assigned-dice counts, so an
 * unrolled level contributes nothing.
 *
 * @function resolveHpScope
 * @param {HpScope} scope - The parsed scope
 * @param {HpScopeContext} ctx - Assigned-dice counts
 * @returns {number} The multiplier
 */
function resolveHpScope(scope: HpScope, ctx: HpScopeContext): number {
  if (scope.s === 'once') return 1;
  if (scope.s === 'level') return ctx.totalRolled;
  if (scope.s === 'level-vocation') return ctx.perVocation[scope.slug] ?? 0;
  return ctx.perSpecialization[scope.slug] ?? 0;
}

/**
 * Builds the {@link HpScopeContext} from a character's assigned hit dice, and the
 * summed value of those dice.
 *
 * @function readAssignedDice
 * @param {CharacterSheet} character - Character to read
 * @returns {{ ctx: HpScopeContext; diceTotal: number }} Scope counts and dice sum
 */
function readAssignedDice(character: CharacterSheet): {
  ctx: HpScopeContext;
  diceTotal: number;
} {
  const specBySlug = new Map<string, string | null>();
  for (const vocation of character.vocations) {
    specBySlug.set(vocation.slug, vocation.specializationSlug);
  }
  const perVocation: Record<string, number> = {};
  const perSpecialization: Record<string, number> = {};
  let totalRolled = 0;
  let diceTotal = 0;
  for (const entry of character.hitDiceLog) {
    if (!entry.addedToHp || entry.result == null) continue;
    totalRolled += 1;
    diceTotal += entry.result;
    perVocation[entry.vocSlug] = (perVocation[entry.vocSlug] ?? 0) + 1;
    const spec = specBySlug.get(entry.vocSlug);
    if (spec) perSpecialization[spec] = (perSpecialization[spec] ?? 0) + 1;
  }
  return { ctx: { totalRolled, perVocation, perSpecialization }, diceTotal };
}

/**
 * Derives a character's hit points from the single source of truth: the rolled
 * hit dice, plus CON as the universal `conMod:level` grant, plus every active
 * passive `hp` grant resolved live, minus the grievous-wound pool. `hpMax` should
 * be treated as a cache of `base`; `effective` is what the sheet displays.
 *
 * CON contributes `conMod × N` where `N` is the count of assigned dice (a die is
 * rolled per level), so display and total agree by construction. The aggregate is
 * clamped once at the end; individual terms may be negative.
 *
 * @function deriveHitPoints
 * @param {CharacterSheet} character - Character to derive from
 * @returns {DerivedHitPoints} The base and grievous-wound-adjusted maximum
 */
export function deriveHitPoints(character: CharacterSheet): DerivedHitPoints {
  const { ctx, diceTotal } = readAssignedDice(character);
  const conMod = computeAbilityModifier(character.abilityScores.con);
  let total = diceTotal + conMod * ctx.totalRolled;
  for (const tag of collectActiveGrants(character)) {
    const grant = parseGrant(tag);
    if (grant?.kind !== 'value' || grant.category !== 'hp') continue;
    total += finiteOrZero(
      resolveHpTerm(grant.term, character) * resolveHpScope(grant.scope, ctx),
    );
  }
  const base = Math.max(0, total);
  const effective = Math.max(0, base - (character.grievousWounds ?? 0));
  return { base, effective };
}

/**
 * The HP a single rolled die of the given vocation carries for the roller's
 * per-row display: the CON modifier plus every per-level `hp` grant whose scope
 * matches this die (`level`, or the matching `level-vocation`/`level-specialization`).
 * Flat `once` grants are excluded — they belong to a separate flat-bonus line.
 *
 * @function perLevelGrantBonus
 * @param {CharacterSheet} character - Character to read grants from
 * @param {string} vocSlug - The die's vocation slug
 * @param {string | null} specSlug - The vocation's specialization slug, if any
 * @returns {number} Per-die grant HP (CON + matching per-level grant terms)
 */
export function perLevelGrantBonus(
  character: CharacterSheet,
  vocSlug: string,
  specSlug: string | null,
): number {
  let bonus = computeAbilityModifier(character.abilityScores.con);
  for (const tag of collectActiveGrants(character)) {
    const grant = parseGrant(tag);
    if (grant?.kind !== 'value' || grant.category !== 'hp') continue;
    const { scope } = grant;
    const applies =
      scope.s === 'level' ||
      (scope.s === 'level-vocation' && scope.slug === vocSlug) ||
      (scope.s === 'level-specialization' &&
        specSlug != null &&
        scope.slug === specSlug);
    if (applies) bonus += resolveHpTerm(grant.term, character);
  }
  return bonus;
}
