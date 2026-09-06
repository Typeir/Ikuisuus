/**
 * @fileoverview Returns absolute paths to locale-specific content directories.
 * @description Constructs absolute filesystem paths to locale-specific content directories
 * under process.cwd().
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires path
 * @requires @/lib/constants/content
 *
 * @example
 * ```typescript
 * import { getContentFolder } from '@/lib/utils/getContentFolder';
 *
 * const enFolder = getContentFolder('en');
 * // Returns: '/absolute/path/to/src/content/en'
 *
 * const esFolder = getContentFolder('es');
 * // Returns: '/absolute/path/to/src/content/es'
 * ```
 * @module src/lib/utils/getContentFolder
 */
import { join } from 'path';

/**
 * Returns the absolute path to the content folder.
 *
 * @param {string} locale the locale for the content language, defaults to en
 * @returns {string} The absolute path to the content directory.
 */
export const getContentFolder = (locale: string = 'en'): string => {
  return join(process.cwd(), 'src', 'content', locale);
};
