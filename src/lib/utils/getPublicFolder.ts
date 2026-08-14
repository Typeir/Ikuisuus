/**
 * @fileoverview Resolves the absolute path to the project's `public/` directory
 * for build-time asset existence checks.
 *
 * @module src/lib/utils/getPublicFolder
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { join } from 'path';

/**
 * Returns the absolute path to the project's `public/` directory via
 * `join(process.cwd(), 'public')`.
 *
 * @returns {string} Absolute path to the public directory.
 *
 * @example
 * ```typescript
 * import { getPublicFolder } from '@/lib/utils/getPublicFolder';
 *
 * const publicDir = getPublicFolder();
 * // Returns: '/absolute/path/to/public'
 * ```
 */
export const getPublicFolder = (): string => {
  return join(process.cwd(), 'public');
};
