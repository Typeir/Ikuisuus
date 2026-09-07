/**
 * @fileoverview What a block costs to use, read off the cost it states.
 * @description A card draws a glyph for the cost rather than typing one, so
 * the mark cannot drift from the cost beside it. Feature blocks and the head
 * of a spell card both take their glyph from here, so a Major Action is the
 * same mark wherever it is spent.
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
export type CostMark = 'major' | 'minor' | 'deed' | 'other';

/**
 * Marks read off a cost, in the order they are tested.
 */
const COST_MARKS: ReadonlyArray<readonly [RegExp, CostMark]> = [
  [/\bmajor\s+action\b/i, 'major'],
  [/\bminor\s+action\b/i, 'minor'],
  [/\bdeeds?\b/i, 'deed'],
];

/**
 * The mark a cost earns: the author's when given, otherwise the action the
 * cost names, and `other` for anything that costs no action.
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
