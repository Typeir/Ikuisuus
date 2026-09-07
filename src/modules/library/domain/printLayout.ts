/**
 * @fileoverview Print Column Layout
 * @description Reads the print column count a document declares in its
 * frontmatter.
 *
 * @module modules/library/domain/printLayout
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/** Columns a printed article uses when its frontmatter declares none. */
export const DEFAULT_PRINT_COLUMNS = 1;

/** Most columns a printed article may declare. */
export const MAX_PRINT_COLUMNS = 3;

/**
 * Print column count a document declares.
 *
 * @param {Record<string, unknown> | undefined} frontmatter - Parsed frontmatter, when the document had any
 * @returns {number} Declared count, clamped to the supported range, or {@link DEFAULT_PRINT_COLUMNS}
 *
 * @description
 * Print runs single column unless a document asks for more. Splitting suits a
 * page of continuous prose; the tables, stat blocks and slot components the
 * current corpus is built from break badly across a narrow column, so a
 * document opts into the split rather than inheriting it.
 *
 * @example
 * printColumnsOf({ printColumns: 2 }); // 2
 * printColumnsOf({}); // 1
 */
export function printColumnsOf(
  frontmatter: Record<string, unknown> | undefined,
): number {
  const declared = Number(frontmatter?.printColumns);

  if (!Number.isInteger(declared)) return DEFAULT_PRINT_COLUMNS;

  return Math.min(
    Math.max(declared, DEFAULT_PRINT_COLUMNS),
    MAX_PRINT_COLUMNS,
  );
}
