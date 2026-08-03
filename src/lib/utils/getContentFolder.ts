/**
 * @fileoverview Content Folder Path Builder - Locale-aware content directory resolution
 * @description Constructs absolute filesystem paths to locale-specific content directories.
 * Uses process.cwd() for build-time and runtime compatibility. Central utility for all
 * content file operations including metadata generation, API routes, and dynamic routing.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires path
 * @requires @/lib/enums/constants
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
 * This uses the current working directory and joins
 * the configured source and content folder names.
 *
 * The segments are written as literals rather than `FolderName.Src` and
 * `FolderName.Content`. Turbopack constant-folds string literals when it
 * derives the file pattern for output tracing, but not enum members, so the
 * enum form left the prefix as bare `/ROOT/` and traced all 36851 project
 * files into every function reaching this helper. The literals narrow the
 * pattern to `src/content`, which is all this function can ever return.
 *
 * @param {string} locale the locale for the content language, defaults to en
 * @returns {string} The absolute path to the content directory.
 */
export const getContentFolder = (locale: string = 'en'): string => {
  return join(process.cwd(), 'src', 'content', locale);
};
