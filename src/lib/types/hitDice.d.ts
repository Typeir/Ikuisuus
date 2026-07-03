/**
 * @fileoverview Hit Dice Types
 * @description Interfaces for the per-level hit die roll log stored on a
 * character sheet. Each entry tracks a single die roll for one vocation level
 * and whether it has been confirmed and added to the character's max HP.
 *
 * @module src/lib/types/hitDice
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

/**
 * A single hit die roll entry for one vocation level. Entries are appended
 * automatically when a new vocation level is detected, with `result: null`
 * until the player chooses to roll. Once confirmed, `addedToHp` is set to
 * `true` and the entry becomes read-only in the UI.
 *
 * @interface HitDieRollEntry
 * @property {string} id - Unique entry identifier (e.g. `"warrior-3"`)
 * @property {string} vocSlug - Vocation slug this entry belongs to
 * @property {string} vocTitle - Vocation display name (e.g. `"Berserker"`)
 * @property {string} dieType - Hit die notation without the `d` prefix: `"12"`, `"10"`, `"8"`, etc.
 * @property {number} levelIndex - 1-indexed level within this vocation for this roll
 * @property {number | null} result - The raw die result (1–N), or `null` if not yet rolled
 * @property {number} conMod - CON modifier captured at the time this entry was created
 * @property {boolean} addedToHp - Whether this roll has been confirmed and added to `hpMax`
 */
export interface HitDieRollEntry {
  id: string;
  vocSlug: string;
  vocTitle: string;
  dieType: string;
  levelIndex: number;
  result: number | null;
  conMod: number;
  addedToHp: boolean;
}
