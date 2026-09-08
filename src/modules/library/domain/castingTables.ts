/**
 * @fileoverview Spell progression tables by casting kind, one row per level.
 * @module modules/library/domain/castingTables
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

/**
 * Casting kinds a vocation or specialization declares.
 */
export const CASTING_KINDS = ['full', 'half', 'third', 'points', 'pact'] as const;

/**
 * A casting kind.
 */
export type CastingKind = (typeof CASTING_KINDS)[number];

/**
 * Slot counts by slot level for levels 1 to 30 of a full caster; the epic rows
 * follow the Epic Spell Slots table of the character progression rule.
 */
export const FULL_CASTER_SLOTS: readonly (readonly number[])[] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 2, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 2, 2, 1],
  [4, 4, 3, 3, 3, 2, 2, 2, 2, 1],
  [4, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1],
  [4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1],
  [4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1],
  [4, 4, 4, 3, 3, 3, 3, 2, 2, 1, 1],
  [4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1],
  [4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1],
];

/**
 * Slot counts for levels 1 to 20 of a half caster, which begins at level 2.
 *
 * @description A half caster casts nothing at first level, so a shallow dip
 * into one buys no spells.
 */
export const HALF_CASTER_SLOTS: readonly (readonly number[])[] = [
  [],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];

/**
 * Slot counts for levels 1 to 20 of a third caster, which begins at level 3.
 */
export const THIRD_CASTER_SLOTS: readonly (readonly number[])[] = [
  [],
  [],
  [2],
  [3],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
];

/**
 * Spell points and highest spell level for levels 1 to 20 of a point caster.
 */
export const POINT_CASTER: readonly (readonly [number, number])[] = [
  [2, 1],
  [4, 1],
  [6, 2],
  [8, 2],
  [15, 3],
  [18, 3],
  [21, 4],
  [24, 4],
  [36, 5],
  [40, 5],
  [44, 6],
  [48, 6],
  [65, 7],
  [70, 7],
  [75, 8],
  [80, 8],
  [102, 9],
  [108, 9],
  [114, 9],
  [120, 9],
];

/**
 * Pact slots and their level for levels 1 to 20 of a pact caster.
 */
export const PACT_CASTER: readonly (readonly [number, number])[] = [
  [1, 1],
  [2, 1],
  [2, 2],
  [2, 2],
  [2, 3],
  [2, 3],
  [2, 4],
  [2, 4],
  [2, 5],
  [2, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [4, 5],
  [4, 5],
  [4, 5],
  [4, 5],
];

/**
 * Ordinal of a slot level, for a column heading.
 *
 * @param {number} level - Slot level
 * @returns {string} `1st`, `2nd`, `3rd`, `4th`, … `12th`
 */
export function slotOrdinal(level: number): string {
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}`;
}

/**
 * Columns a casting kind prints for a table that runs to `levels`
 *
 * @param {CastingKind} kind - Casting kind
 * @param {number} levels - Last level printed
 * @returns {{ columns: string[], cells: string[][] }} Column labels, and one
 * row of cell text per level; a level past the table prints empty cells
 */
export function castingColumns(
  kind: CastingKind,
  levels: number,
): { columns: string[]; cells: string[][] } {
  if (kind === 'points' || kind === 'pact') {
    const table = kind === 'points' ? POINT_CASTER : PACT_CASTER;
    const columns =
      kind === 'points' ? ['Spell Points', 'Max Spell Level'] : ['Spell Slots', 'Slot Level'];
    const cells = Array.from({ length: levels }, (_, i) => {
      const row = table[i];
      return row ? [String(row[0]), String(row[1])] : ['', ''];
    });
    return { columns, cells };
  }
  const table =
    kind === 'full' ? FULL_CASTER_SLOTS : kind === 'half' ? HALF_CASTER_SLOTS : THIRD_CASTER_SLOTS;
  const rows = table.slice(0, levels);
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const columns = Array.from({ length: width }, (_, i) => slotOrdinal(i + 1));
  const cells = Array.from({ length: levels }, (_, i) =>
    columns.map((_, slot) => {
      const count = table[i]?.[slot];
      return count === undefined ? '' : String(count);
    }),
  );
  return { columns, cells };
}
