/**
 * CLI Argument Helpers
 *
 * @fileoverview Shared helpers for reading positional values and boolean flags
 * from process argument arrays.
 *
 * @module scripts/core/cliArgs
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Returns the value immediately following a flag.
 *
 * @param flag - Flag to search for (for example, `--root`)
 * @param argv - Argument vector to inspect
 * @returns Argument value if present
 */
export const getArgValue = (
  flag: string,
  argv: string[] = process.argv,
): string | undefined => {
  const idx = argv.indexOf(flag);
  return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : undefined;
};

/**
 * Returns a flag value when present, otherwise a fallback.
 *
 * @param flag - Flag to search for
 * @param fallback - Fallback when missing
 * @param argv - Argument vector to inspect
 * @returns Value from argv or fallback
 */
export const getArgOrFallback = (
  flag: string,
  fallback: string,
  argv: string[] = process.argv,
): string => getArgValue(flag, argv) ?? fallback;

/**
 * Returns true when a boolean flag is present.
 *
 * @param flag - Flag name (for example, `--dry`)
 * @param argv - Argument vector to inspect
 * @returns True when the flag is present
 */
export const hasFlag = (flag: string, argv: string[] = process.argv): boolean =>
  argv.includes(flag);
