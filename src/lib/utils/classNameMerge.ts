/**
 * Lightweight className merge utility
 *
 * @fileoverview A minimal alternative to clsx for conditionally combining classnames.
 * Handles strings, objects with conditional keys, and arrays. Filters out falsy values.
 *
 * @module lib/utils/classNameMerge
 * @version 1.0.0
 * @author Typeir
 * @since 2026-01-17
 *
 * @description
 * Combines multiple class inputs into a single className string. Supports:
 * - String classes: `'className'`
 * - Conditional strings: `open && 'open-class'`
 * - Object conditions: `{ [styles.active]: isActive }`
 * - Arrays and nested structures
 *
 * Zero dependencies. Filters falsy values automatically.
 *
 * @example
 * ```ts
 * // Basic strings
 * cn('btn', 'primary') // 'btn primary'
 *
 * // Conditional strings
 * cn('btn', open && 'open') // 'btn open' or 'btn'
 *
 * // Object conditions
 * cn('btn', { [styles.active]: isActive }) // 'btn _active_xyz'
 *
 * // Mixed
 * cn('btn', { [styles.open]: open }, 'ml-2') // combines all
 * ```
 */

type ClassValue =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean | undefined>
  | ClassValue[];

/**
 * Merges multiple class values into a single className string
 *
 * @function cn
 * @param {...ClassValue[]} args - Class strings, objects, arrays, or conditionals
 * @returns {string} Merged className string with falsy values filtered out
 *
 * @description
 * Recursively processes all input types:
 * - Strings: included as-is
 * - Objects: keys included if value is truthy
 * - Arrays: flattened and processed recursively
 * - Falsy values (false, null, undefined, empty strings): filtered out
 *
 * Performance optimized with early returns for common cases.
 *
 * @example
 * const styles = { open: '_open_abc', icon: '_icon_def' };
 * cn(
 *   'sidebar',
 *   styles.icon,
 *   { [styles.open]: isOpen },
 *   !disabled && 'interactive'
 * )
 * // Returns: 'sidebar _icon_def _open_abc interactive'
 */
export const cn = (...args: ClassValue[]): string => {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string') {
      classes.push(arg);
      continue;
    }

    if (typeof arg === 'object' && !Array.isArray(arg)) {
      for (const key in arg) {
        if (arg[key]) {
          classes.push(key);
        }
      }
      continue;
    }

    if (Array.isArray(arg)) {
      const merged = cn(...arg);
      if (merged) {
        classes.push(merged);
      }
    }
  }

  return classes.join(' ');
};

export default cn;
