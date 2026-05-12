/**
 * @fileoverview Public folder path builder — resolves the absolute path to the
 * project's `public/` directory for build-time asset existence checks.
 *
 * Mirrors `getContentFolder` so that all raw `process.cwd()` + directory
 * concatenation is confined to a single utility layer rather than scattered
 * across SEO helpers, API routes, or other application code.
 *
 * @module src/lib/utils/getPublicFolder
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { join } from 'path';

/**
 * Returns the absolute path to the project's `public/` directory.
 *
 * Uses `process.cwd()` for build-time and runtime compatibility, consistent
 * with `getContentFolder`.
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
