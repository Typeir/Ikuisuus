/**
 * @fileoverview Hit Dice Types
 * @description Interfaces for the per-level hit die roll log stored on a
 * character sheet.
 *
 * @module src/lib/types/hitDice
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

/**
 * A single hit die roll entry for one vocation level.
 *
 * @interface HitDieRollEntry
 * @property {string} id - Unique entry identifier (e.g. `"warrior-3"`)
 * @property {string} vocSlug - Vocation slug this entry belongs to
 * @property {string} vocTitle - Vocation display name (e.g. `"Berserker"`)
 * @property {number} dieType - Hit die face count
 * @property {number} levelIndex - 1-indexed level within this vocation for this roll
 * @property {number | null} result - The raw die result (1–N), or `null` if not yet rolled
 * @property {number} conMod - CON modifier captured at the time this entry was created
 * @property {boolean} addedToHp - Whether this roll has been confirmed and added to `hpMax`
 */
export interface HitDieRollEntry {
  id: string;
  vocSlug: string;
  vocTitle: string;
  dieType: number;
  levelIndex: number;
  result: number | null;
  conMod: number;
  addedToHp: boolean;
}
