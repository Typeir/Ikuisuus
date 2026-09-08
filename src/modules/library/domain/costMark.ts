/**
 * @fileoverview What a block costs to use, read off the cost it states.
 * @description A card draws a glyph for the cost rather than typing one
 *
 * @module modules/library/domain/costMark
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import type { ReactNode } from 'react';

/**
 * What a block costs to use, as a card's glyph reports it.
 */
export type CostMark =
  | 'major'
  | 'minor'
  | 'reaction'
  | 'reflex'
  | 'deed'
  | 'other';

/**
 * Marks read off a cost, in the order they are tested.
 */
const COST_MARKS: ReadonlyArray<readonly [RegExp, CostMark]> = [
  [/\bmajor\s+action\b/i, 'major'],
  [/\bminor\s+action\b/i, 'minor'],
  [/\breactions?\b/i, 'reaction'],
  /* A reflex is asked of a creature and costs it nothing, so it is not an
     action and never wears an action's pip. */
  [/\breflexe?s?\b/i, 'reflex'],
  [/\bdeeds?\b/i, 'deed'],
];

/**
 * How many of a cost a block spends.
 *
 * @description A block that spends two deeds wears two glyphs, so the price is
 * read at a glance rather than counted out of the text. A cost with no number
 * is one of whatever it names.
 *
 * @param {ReactNode} cost - The cost as the page states it
 * @returns {number} Units spent, at least one
 *
 * @example
 * markCount('2 Deeds'); // 2
 * markCount('1 Major Action'); // 1
 */
export function markCount(cost: ReactNode): number {
  if (typeof cost !== 'string') return 1;
  const match = cost.match(/(\d+)/);
  const value = match ? Number(match[1]) : 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * The mark a cost earns
 *
 * @param {CostMark} [explicit] - Mark the author set
 * @param {ReactNode} cost - The cost as the page states it
 * @returns {CostMark} Mark to stamp
 */
export function markOf(
  explicit: CostMark | undefined,
  cost: ReactNode,
): CostMark {
  if (explicit) return explicit;
  if (typeof cost !== 'string') return 'other';
  return COST_MARKS.find(([pattern]) => pattern.test(cost))?.[1] ?? 'other';
}
