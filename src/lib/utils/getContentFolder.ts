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
 */
import { join } from 'path';
import { FolderName } from '../enums/constants';

/**
 * Returns the absolute path to the content folder.
 *
 * This uses the current working directory and joins
 * the configured source and content folder names.
 * @param {string} locale the locale for the content language, defaults to en
 * @returns {string} The absolute path to the content directory.
 */
export const getContentFolder = (locale: string = 'en'): string => {
  return join(process.cwd(), FolderName.Src, FolderName.Content, locale);
};
