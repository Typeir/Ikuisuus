/**
 * MDX Component Name Utilities
 *
 * @fileoverview Converts kebab-case MDX filenames to PascalCase component names,
 * stripping intermediate suffixes like .hidden and .sheet.
 *
 * @module findReusableMdxOutliers/nameUtils
 * @version 1.0.0
 * @since 3.0.0
 */

import path from 'path';

/** @constant Regex to strip intermediate suffixes before PascalCase conversion */
const INTERMEDIATE_SUFFIX = /\.(hidden|sheet)$/i;

/**
 * Converts kebab-case or snake_case to PascalCase.
 *
 * @param str - Input string
 * @returns PascalCase string
 */
export const pascalCase = (str: string): string =>
  str
    .replace(/[-_]+/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/\s+/g, '');

/**
 * Derives the PascalCase component name from an MDX file path.
 *
 * @param filePath - Absolute path to the MDX file
 * @returns PascalCase component name
 */
export const componentNameFromPath = (filePath: string): string =>
  pascalCase(path.basename(filePath, '.mdx').replace(INTERMEDIATE_SUFFIX, ''));
